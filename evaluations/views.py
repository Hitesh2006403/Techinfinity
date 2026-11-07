from decimal import Decimal
from django.db import transaction
from django.http import FileResponse, Http404
from django.utils.http import content_disposition_header
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from config.responses import api_response
from submissions.models import Submission
from submissions.state import transition_submission, InvalidStatusTransition
from .models import Evaluation
from .permissions import (
    CanEvaluateSubmission,
    CanViewEvaluation,
    IsTeacherOwnerForReview,
)
from .serializers import (
    EvaluationSerializer,
    TeacherApproveSerializer,
    TeacherUpdateMarksSerializer,
)
from .services import evaluate_submission, EvaluationServiceError
from .reporting import generate_evaluation_report


class EvaluateSubmissionView(APIView):
    """
    POST /api/submissions/<id>/evaluate/
    Triggers AI evaluation for a given submission using Groq.
    """

    permission_classes = [permissions.IsAuthenticated, CanEvaluateSubmission]

    def post(self, request, pk):
        submission = get_object_or_404(
            Submission.objects.select_related("question", "question__teacher", "student"),
            pk=pk,
        )
        self.check_object_permissions(request, submission)

        # Check if already evaluated
        if hasattr(submission, "evaluation") and submission.evaluation is not None:
            serializer = EvaluationSerializer(submission.evaluation, context={"request": request})
            return api_response(
                success=True,
                message="Submission has already been evaluated.",
                data={"evaluation": serializer.data},
                status_code=status.HTTP_200_OK,
            )

        try:
            evaluation = evaluate_submission(submission)
            serializer = EvaluationSerializer(evaluation, context={"request": request})
            return api_response(
                success=True,
                message="Submission evaluated successfully by Groq AI.",
                data={"evaluation": serializer.data},
                status_code=status.HTTP_201_CREATED,
            )
        except EvaluationServiceError as e:
            return api_response(
                success=False,
                message="AI evaluation could not be completed.",
                errors={"detail": str(e)},
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except Exception as e:
            return api_response(
                success=False,
                message="An unexpected error occurred during evaluation.",
                errors={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EvaluationDetailView(APIView):
    """
    GET /api/evaluations/<id>/
    Retrieves full evaluation details.
    """

    permission_classes = [permissions.IsAuthenticated, CanViewEvaluation]

    def get(self, request, pk):
        queryset = Evaluation.objects.select_related(
                "submission", "submission__question", "submission__student", "submission__question__teacher"
            )
        if getattr(request.user, "role", None) == "STUDENT":
            queryset = queryset.filter(submission__student=request.user)
        evaluation = get_object_or_404(queryset, pk=pk)
        self.check_object_permissions(request, evaluation)
        serializer = EvaluationSerializer(evaluation, context={"request": request})
        return api_response(
            success=True,
            message="Evaluation details retrieved successfully.",
            data={"evaluation": serializer.data},
            status_code=status.HTTP_200_OK,
        )


class SubmissionEvaluationDetailView(APIView):
    """
    GET /api/submissions/<id>/evaluation/
    Retrieves evaluation details for a specific submission.
    """

    permission_classes = [permissions.IsAuthenticated, CanViewEvaluation]

    def get(self, request, submission_id):
        queryset = Evaluation.objects.select_related(
                "submission", "submission__question", "submission__student", "submission__question__teacher"
            )
        if getattr(request.user, "role", None) == "STUDENT":
            queryset = queryset.filter(submission__student=request.user)
        evaluation = get_object_or_404(queryset, submission_id=submission_id)
        self.check_object_permissions(request, evaluation)
        serializer = EvaluationSerializer(evaluation, context={"request": request})
        return api_response(
            success=True,
            message="Evaluation details retrieved successfully.",
            data={"evaluation": serializer.data},
            status_code=status.HTTP_200_OK,
        )


class TeacherApproveEvaluationView(APIView):
    """
    POST /api/evaluations/<id>/approve/
    Teacher approves AI suggested marks without changes.
    Does NOT publish to student.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerForReview]

    def post(self, request, pk):
        evaluation = get_object_or_404(
            Evaluation.objects.select_related(
                "submission", "submission__question", "submission__question__teacher"
            ),
            pk=pk,
        )
        self.check_object_permissions(request, evaluation)

        serializer = TeacherApproveSerializer(data=request.data)
        if serializer.is_valid():
            if evaluation.status in {Evaluation.Status.APPROVED, Evaluation.Status.PUBLISHED}:
                return api_response(success=False, message="This evaluation has already been approved.", status_code=status.HTTP_409_CONFLICT)
            if evaluation.submission.status != Submission.Status.PENDING_TEACHER_REVIEW:
                return api_response(success=False, message="Only evaluations pending teacher review can be approved.", status_code=status.HTTP_409_CONFLICT)
            question_results = list(evaluation.question_evaluations.all())
            if not question_results:
                return api_response(success=False, message="An evaluation with question-level results is required before approval.", status_code=status.HTTP_400_BAD_REQUEST)
            teacher_comments = serializer.validated_data.get("teacher_comments", "")

            with transaction.atomic():
                evaluation.teacher_approved_marks = sum((row.awarded_marks for row in question_results), Decimal("0.00"))
                if teacher_comments:
                    evaluation.teacher_comments = teacher_comments
                evaluation.reviewed_at = timezone.now()
                evaluation.save(
                    update_fields=[
                        "teacher_approved_marks",
                        "teacher_comments",
                        "reviewed_at",
                    ]
                )
                try:
                    transition_submission(evaluation.submission, Submission.Status.APPROVED, evaluation=evaluation, actor=request.user)
                except InvalidStatusTransition as exc:
                    return api_response(success=False, message=str(exc), status_code=status.HTTP_409_CONFLICT)
                evaluation = generate_evaluation_report(evaluation)

            output_serializer = EvaluationSerializer(evaluation, context={"request": request})
            return api_response(
                success=True,
                message="AI evaluation marks approved successfully by teacher.",
                data={"evaluation": output_serializer.data},
                status_code=status.HTTP_200_OK,
            )
        return api_response(
            success=False,
            message="Approval request validation failed.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class TeacherApproveAndPublishView(APIView):
    """
    POST /api/evaluations/<id>/approve-and-publish/
    Teacher approves and publishes the evaluation to the student in a single atomic transaction.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerForReview]

    def post(self, request, pk):
        evaluation = get_object_or_404(
            Evaluation.objects.select_related(
                "submission", "submission__question", "submission__question__teacher"
            ),
            pk=pk,
        )
        self.check_object_permissions(request, evaluation)

        teacher_comments = request.data.get("teacher_comments", "")
        if evaluation.status == Evaluation.Status.PUBLISHED:
            return api_response(success=False, message="This evaluation is already published.", status_code=status.HTTP_409_CONFLICT)
        if evaluation.status not in {Evaluation.Status.AI_EVALUATED, Evaluation.Status.PENDING_TEACHER_REVIEW} or evaluation.submission.status != Submission.Status.PENDING_TEACHER_REVIEW:
            return api_response(success=False, message="Only evaluations pending teacher review can be approved and published.", status_code=status.HTTP_409_CONFLICT)
        question_results = list(evaluation.question_evaluations.all())
        if not question_results:
            return api_response(success=False, message="An evaluation with question-level results is required before publication.", status_code=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            evaluation.teacher_approved_marks = sum((row.awarded_marks for row in question_results), Decimal("0.00"))
            evaluation.reviewed_at = timezone.now()
            if teacher_comments:
                evaluation.teacher_comments = teacher_comments
            evaluation.save(
                update_fields=[
                    "teacher_approved_marks",
                    "reviewed_at",
                    "teacher_comments",
                ]
            )
            try:
                if evaluation.status != Evaluation.Status.APPROVED:
                    transition_submission(evaluation.submission, Submission.Status.APPROVED, evaluation=evaluation, actor=request.user)
                transition_submission(evaluation.submission, Submission.Status.PUBLISHED, evaluation=evaluation, actor=request.user)
            except InvalidStatusTransition as exc:
                return api_response(success=False, message=str(exc), status_code=status.HTTP_409_CONFLICT)
            evaluation = generate_evaluation_report(evaluation)

        output_serializer = EvaluationSerializer(evaluation, context={"request": request})
        return api_response(
            success=True,
            message="Evaluation approved and published to the student portal.",
            data={"evaluation": output_serializer.data},
            status_code=status.HTTP_200_OK,
        )


class TeacherUpdateMarksView(APIView):
    """
    POST /api/evaluations/<id>/update-marks/
    Teacher overrides or modifies AI suggested marks with customized score and comments.
    Original suggested_marks and ai_marks are permanently preserved.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerForReview]

    def post(self, request, pk):
        evaluation = get_object_or_404(
            Evaluation.objects.select_related(
                "submission", "submission__question", "submission__question__teacher"
            ),
            pk=pk,
        )
        self.check_object_permissions(request, evaluation)

        serializer = TeacherUpdateMarksSerializer(
            data=request.data, context={"evaluation": evaluation}
        )
        if serializer.is_valid():
            if evaluation.status in {Evaluation.Status.APPROVED, Evaluation.Status.PUBLISHED}:
                return api_response(success=False, message="Marks cannot be edited after approval or publication.", status_code=status.HTTP_409_CONFLICT)
            if evaluation.submission.status != Submission.Status.PENDING_TEACHER_REVIEW:
                return api_response(success=False, message="Only evaluations pending teacher review can be edited.", status_code=status.HTTP_409_CONFLICT)
            with transaction.atomic():
                teacher_comments = serializer.validated_data.get("teacher_comments", "")
                question_updates = serializer.validated_data.get("question_evaluations", [])

                if question_updates:
                    for q_data in question_updates:
                        qe = evaluation.question_evaluations.get(id=q_data["id"])
                        for field in ("awarded_marks", "feedback", "teacher_override_reason", "teacher_comments"):
                            if field in q_data:
                                setattr(qe, field, q_data[field])
                        qe.save(update_fields=["awarded_marks", "feedback", "teacher_override_reason", "teacher_comments"])

                    # The authoritative total is always the sum of final question marks.
                    total_from_questions = sum((q.awarded_marks for q in evaluation.question_evaluations.all()), Decimal("0.00"))
                    evaluation.teacher_approved_marks = total_from_questions
                elif serializer.validated_data.get("approved_marks") is not None:
                    if evaluation.question_evaluations.exists():
                        return api_response(success=False, message="Send question-wise marks so the final total can be computed from them.", status_code=status.HTTP_400_BAD_REQUEST)
                    evaluation.teacher_approved_marks = serializer.validated_data["approved_marks"]

                if "feedback" in serializer.validated_data:
                    evaluation.feedback = serializer.validated_data["feedback"]
                if teacher_comments:
                    evaluation.teacher_comments = teacher_comments
                evaluation.reviewed_at = timezone.now()
                evaluation.save(
                    update_fields=[
                        "teacher_approved_marks",
                        "feedback",
                        "teacher_comments",
                        "reviewed_at",
                    ]
                )
                evaluation = generate_evaluation_report(evaluation)

            output_serializer = EvaluationSerializer(evaluation, context={"request": request})
            return api_response(
                success=True,
                message="Evaluation marks modified and recorded successfully by teacher.",
                data={"evaluation": output_serializer.data},
                status_code=status.HTTP_200_OK,
            )
        return api_response(
            success=False,
            message="Mark modification validation failed.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class TeacherPublishEvaluationView(APIView):
    """Publish a teacher-reviewed evaluation to the student portal."""

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerForReview]

    def post(self, request, pk):
        evaluation = get_object_or_404(
            Evaluation.objects.select_related("submission", "submission__question", "submission__question__teacher"),
            pk=pk,
        )
        self.check_object_permissions(request, evaluation)
        if evaluation.status == Evaluation.Status.PUBLISHED:
            return api_response(success=False, message="This evaluation is already published.", status_code=status.HTTP_409_CONFLICT)
        if evaluation.status != Evaluation.Status.APPROVED:
            return api_response(success=False, message="Review or approve the evaluation before publishing.", status_code=status.HTTP_400_BAD_REQUEST)
        if not evaluation.question_evaluations.exists():
            return api_response(success=False, message="An evaluation with question-level results is required before publication.", status_code=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            try:
                transition_submission(evaluation.submission, Submission.Status.PUBLISHED, evaluation=evaluation, actor=request.user)
            except InvalidStatusTransition as exc:
                return api_response(success=False, message=str(exc), status_code=status.HTTP_409_CONFLICT)

        return api_response(
            success=True,
            message="Evaluation published to the student portal.",
            data={"published_at": evaluation.published_at, "status": evaluation.status},
        )


class EvaluationReportDownloadView(APIView):
    """Authenticated endpoint to view or download evaluation PDF report."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        queryset = Evaluation.objects.select_related(
                "submission__student", "submission__question__teacher", "submission__subject"
            )
        if getattr(request.user, "role", None) == "STUDENT":
            queryset = queryset.filter(submission__student=request.user)
        evaluation = get_object_or_404(queryset, pk=pk)
        user = request.user
        is_teacher_owner = (
            evaluation.submission.question.teacher == user
            or (evaluation.submission.subject and evaluation.submission.subject.teacher == user)
        )
        is_student_owner = evaluation.submission.student == user

        if not (is_teacher_owner or is_student_owner or user.is_staff or user.is_superuser):
            return api_response(
                success=False,
                message="You are not authorized to view this evaluation report.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if is_student_owner and not (user.is_staff or user.is_superuser):
            if evaluation.published_at is None:
                return api_response(
                    success=False,
                    message="Evaluation report is not available until published by your teacher.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

        if not evaluation.report_document:
            evaluation = generate_evaluation_report(evaluation)

        response = FileResponse(evaluation.report_document.open("rb"), content_type="application/pdf")
        filename = evaluation.report_document.name.split("/")[-1]
        response["Content-Disposition"] = content_disposition_header(False, filename)
        return response
