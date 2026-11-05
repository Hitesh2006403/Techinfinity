from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from config.responses import api_response
from submissions.models import Submission
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


class EvaluateSubmissionView(APIView):
    """
    POST /api/submissions/<id>/evaluate/
    Triggers AI evaluation for a given submission using Google Gemini.
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
            serializer = EvaluationSerializer(submission.evaluation)
            return api_response(
                success=True,
                message="Submission has already been evaluated.",
                data={"evaluation": serializer.data},
                status_code=status.HTTP_200_OK,
            )

        try:
            evaluation = evaluate_submission(submission)
            serializer = EvaluationSerializer(evaluation)
            return api_response(
                success=True,
                message="Submission evaluated successfully by Gemini AI.",
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
        evaluation = get_object_or_404(
            Evaluation.objects.select_related(
                "submission", "submission__question", "submission__student", "submission__question__teacher"
            ),
            pk=pk,
        )
        self.check_object_permissions(request, evaluation)
        serializer = EvaluationSerializer(evaluation)
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
        evaluation = get_object_or_404(
            Evaluation.objects.select_related(
                "submission", "submission__question", "submission__student", "submission__question__teacher"
            ),
            submission_id=submission_id,
        )
        self.check_object_permissions(request, evaluation)
        serializer = EvaluationSerializer(evaluation)
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
            teacher_comments = serializer.validated_data.get("teacher_comments", "")

            # Set approved marks to AI suggested marks
            evaluation.teacher_approved_marks = evaluation.suggested_marks
            evaluation.teacher_review_status = Evaluation.ReviewStatus.APPROVED
            if teacher_comments:
                evaluation.teacher_comments = teacher_comments
            evaluation.reviewed_at = timezone.now()
            evaluation.save(
                update_fields=[
                    "teacher_approved_marks",
                    "teacher_review_status",
                    "teacher_comments",
                    "reviewed_at",
                ]
            )

            # Update submission status to REVIEWED
            submission = evaluation.submission
            submission.status = Submission.Status.REVIEWED
            submission.save(update_fields=["status"])

            output_serializer = EvaluationSerializer(evaluation)
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


class TeacherUpdateMarksView(APIView):
    """
    POST /api/evaluations/<id>/update-marks/
    Teacher overrides or modifies AI suggested marks with customized score and comments.
    Original suggested_marks is permanently preserved.
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
            approved_marks = serializer.validated_data["approved_marks"]
            teacher_comments = serializer.validated_data.get("teacher_comments", "")

            evaluation.teacher_approved_marks = approved_marks
            evaluation.teacher_review_status = Evaluation.ReviewStatus.MODIFIED
            if teacher_comments:
                evaluation.teacher_comments = teacher_comments
            evaluation.reviewed_at = timezone.now()
            evaluation.save(
                update_fields=[
                    "teacher_approved_marks",
                    "teacher_review_status",
                    "teacher_comments",
                    "reviewed_at",
                ]
            )

            # Update submission status to REVIEWED
            submission = evaluation.submission
            submission.status = Submission.Status.REVIEWED
            submission.save(update_fields=["status"])

            output_serializer = EvaluationSerializer(evaluation)
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
