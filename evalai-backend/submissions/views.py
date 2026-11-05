from rest_framework.views import APIView
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from config.responses import api_response
from .models import Submission
from .serializers import SubmissionCreateSerializer, SubmissionSerializer
from .permissions import IsStudentToSubmit, CanAccessSubmission


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

        serializer = SubmissionSerializer(queryset, many=True)
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
            output = SubmissionSerializer(submission)
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

        serializer = SubmissionSerializer(submission)
        return api_response(
            success=True,
            message="Submission details retrieved successfully.",
            data={"submission": serializer.data},
            status_code=status.HTTP_200_OK,
        )
