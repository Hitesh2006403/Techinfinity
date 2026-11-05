from decimal import Decimal
from rest_framework.views import APIView
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from config.responses import api_response
from .models import Submission, UploadedAnswerSheet
from .serializers import SubmissionCreateSerializer, SubmissionSerializer
from .serializers import (
    TeacherAnswerSheetUploadSerializer,
    RawAnswerSheetUploadSerializer,
    MappedAnswerSheetUploadSerializer,
)
from .permissions import IsStudentToSubmit, CanAccessSubmission
from accounts.permissions import IsTeacher
from questions.models import Question
from evaluations.models import Evaluation
from evaluations.services import evaluate_submission, EvaluationServiceError


class TeacherAnswerSheetUploadView(APIView):
    """Allow a teacher to attach a student's answer-sheet document to a question."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = TeacherAnswerSheetUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Answer-sheet upload failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        question = serializer.validated_data["question_id"]
        if question.teacher_id != request.user.id:
            return api_response(
                success=False,
                message="You can only upload answer sheets for your own questions.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        submission = Submission.objects.create(
            question=question,
            student=serializer.validated_data["student_id"],
            answer_document=serializer.validated_data["answer_document"],
            answer_text=serializer.validated_data.get("answer_text", "").strip(),
        )
        return api_response(
            success=True,
            message="Student answer sheet uploaded successfully.",
            data={"submission": SubmissionSerializer(submission).data},
            status_code=status.HTTP_201_CREATED,
        )


class RawAnswerSheetUploadView(APIView):
    """Store an answer document without requiring question/student metadata."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = RawAnswerSheetUploadSerializer(data=request.data)
        if serializer.is_valid():
            subject = serializer.validated_data.get("subject")
            if subject and subject.teacher_id != request.user.id:
                return api_response(
                    success=False,
                    message="You can only upload documents under your own subjects.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            upload = serializer.save(teacher=request.user)
            return api_response(
                success=True,
                message="Answer document uploaded successfully.",
                data={"upload": RawAnswerSheetUploadSerializer(upload).data},
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Answer document upload failed.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class MappedAnswerSheetUploadView(APIView):
    """Upload an answer sheet mapped to one teacher subject and one student."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = MappedAnswerSheetUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Mapped answer-sheet upload failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        subject = serializer.validated_data["subject"]
        if subject.teacher_id != request.user.id:
            return api_response(
                success=False,
                message="You can only use subjects that you created.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        question_paper = subject.answer_sheets.filter(
            document_type=UploadedAnswerSheet.DocumentType.QUESTION_PAPER
        ).order_by("-uploaded_at").first()
        if not question_paper:
            return api_response(
                success=False,
                message="Upload the question paper for this subject before uploading answer sheets.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        question, _ = Question.objects.get_or_create(
            teacher=request.user,
            subject=subject.name,
            title=f"{subject.name} examination",
            defaults={
                "question_text": "Evaluate the student's answer against the uploaded exam question paper.",
                "reference_answer": subject.notes_description or "Use the uploaded common subject reference document.",
                "max_marks": Decimal("100.00"),
                "marking_rubric": subject.notes_description or "Evaluate correctness, completeness, reasoning, and clarity.",
                "is_active": True,
            },
        )
        upload = UploadedAnswerSheet.objects.create(
            teacher=request.user,
            subject=subject,
            student=serializer.validated_data["student"],
            document_type=UploadedAnswerSheet.DocumentType.ANSWER_SHEET,
            document=serializer.validated_data["document"],
        )
        submission = Submission.objects.create(
            question=question,
            student=serializer.validated_data["student"],
            answer_document=upload.document.name,
            answer_text="",
        )
        upload.submission = submission
        upload.save(update_fields=["submission"])
        try:
            evaluation = evaluate_submission(submission)
            evaluation_message = "AI evaluation completed and sent for teacher review."
        except Exception as exc:
            evaluation = Evaluation.objects.create(
                submission=submission,
                suggested_marks=Decimal("0.00"),
                max_marks=question.max_marks,
                feedback="Automatic evaluation could not be completed. Please review this answer sheet manually.",
                reasoning=str(exc),
                confidence=0.0,
                teacher_review_status=Evaluation.ReviewStatus.PENDING,
            )
            submission.status = Submission.Status.EVALUATED
            submission.save(update_fields=["status"])
            evaluation_message = "Answer sheet uploaded and sent for teacher review because automatic evaluation was unavailable."
        return api_response(
            success=True,
            message=evaluation_message,
            data={
                "upload": RawAnswerSheetUploadSerializer(upload).data,
                "submission": SubmissionSerializer(submission).data,
                "evaluation": {"id": evaluation.id, "status": evaluation.teacher_review_status},
            },
            status_code=status.HTTP_201_CREATED,
        )


class SubjectDocumentListView(APIView):
    """List documents uploaded under one teacher-owned subject."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request, subject_id):
        documents = UploadedAnswerSheet.objects.filter(
            teacher=request.user, subject_id=subject_id
        ).select_related("student")
        serializer = RawAnswerSheetUploadSerializer(documents, many=True)
        return api_response(
            success=True,
            message="Subject documents retrieved successfully.",
            data={"documents": serializer.data},
        )


class SubmissionListCreateView(APIView):
    """
    GET /api/submissions/ - List submissions filtered by user role.
    POST /api/submissions/ - Submit answer to a question (Student only).
    """

    permission_classes = [permissions.IsAuthenticated, IsStudentToSubmit]

    def get(self, request):
        user = request.user
        queryset = (
            Submission.objects.select_related(
                "question", "question__teacher", "student"
            )
            .prefetch_related("evaluation")
            .all()
        )

        if getattr(user, "role", None) == "STUDENT" and not (
            user.is_staff or user.is_superuser
        ):
            queryset = queryset.filter(student=user)
        elif getattr(user, "role", None) == "TEACHER" and not (
            user.is_staff or user.is_superuser
        ):
            queryset = queryset.filter(question__teacher=user)

        # Optional filters
        question_id = request.query_params.get("question_id")
        if question_id:
            queryset = queryset.filter(question_id=question_id)

        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter.strip())

        serializer = SubmissionSerializer(queryset, many=True, context={"request": request})
        return api_response(
            success=True,
            message="Submissions retrieved successfully.",
            data={"count": queryset.count(), "submissions": serializer.data},
            status_code=status.HTTP_200_OK,
        )

    def post(self, request):
        if getattr(request.user, "role", None) != "STUDENT":
            return api_response(
                success=False,
                message="Only students are authorized to submit answers.",
                errors={"role": "User role must be STUDENT."},
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = SubmissionCreateSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.validated_data["question"]
            if not question.is_active:
                return api_response(
                    success=False,
                    message="This question is currently inactive and not accepting submissions.",
                    errors={"question": "Question is inactive."},
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            submission = serializer.save(student=request.user)
            output = SubmissionSerializer(submission, context={"request": request})
            return api_response(
                success=True,
                message="Answer submitted successfully.",
                data={"submission": output.data},
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Failed to submit answer.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class SubmissionDetailView(APIView):
    """
    GET /api/submissions/<id>/ - View submission details.
    """

    permission_classes = [permissions.IsAuthenticated, CanAccessSubmission]

    def get(self, request, pk):
        submission = get_object_or_404(
            Submission.objects.select_related(
                "question", "question__teacher", "student"
            ).prefetch_related("evaluation"),
            pk=pk,
        )
        self.check_object_permissions(request, submission)

        serializer = SubmissionSerializer(submission, context={"request": request})
        return api_response(
            success=True,
            message="Submission details retrieved successfully.",
            data={"submission": serializer.data},
            status_code=status.HTTP_200_OK,
        )
