from rest_framework.views import APIView
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from config.responses import api_response
from .models import Question
from .serializers import QuestionSerializer, QuestionCreateUpdateSerializer
from .permissions import IsTeacherOwnerOrReadOnly


class QuestionListCreateView(APIView):
    """
    GET /api/questions/ - List active questions for students, or teacher's questions.
    POST /api/questions/ - Create a new question (Teacher only).
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerOrReadOnly]

    def get(self, request):
        user = request.user
        queryset = Question.objects.select_related("teacher").all()

        # Filtering logic based on role
        if getattr(user, "role", None) == "TEACHER" and not (
            user.is_staff or user.is_superuser
        ):
            show_all = request.query_params.get("all", "false").lower() == "true"
            if not show_all:
                queryset = queryset.filter(teacher=user)
        elif getattr(user, "role", None) == "STUDENT":
            # Students only see active questions open for submissions
            queryset = queryset.filter(is_active=True)

        # Subject query filter
        subject_filter = request.query_params.get("subject")
        if subject_filter:
            queryset = queryset.filter(subject__iexact=subject_filter.strip())

        serializer = QuestionSerializer(
            queryset, many=True, context={"request": request}
        )
        return api_response(
            success=True,
            message="Questions retrieved successfully.",
            data={"count": queryset.count(), "questions": serializer.data},
            status_code=status.HTTP_200_OK,
        )

    def post(self, request):
        if getattr(request.user, "role", None) != "TEACHER":
            return api_response(
                success=False,
                message="Only teachers are authorized to create questions.",
                errors={"role": "User role must be TEACHER."},
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = QuestionCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.save(teacher=request.user)
            output_serializer = QuestionSerializer(
                question, context={"request": request}
            )
            return api_response(
                success=True,
                message="Question created successfully.",
                data={"question": output_serializer.data},
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Failed to create question. Please check input parameters.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class QuestionDetailView(APIView):
    """
    GET /api/questions/<id>/ - View question details.
    PUT /api/questions/<id>/ - Update entire question (Teacher owner only).
    PATCH /api/questions/<id>/ - Partial update question (Teacher owner only).
    DELETE /api/questions/<id>/ - Delete question (Teacher owner only).
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerOrReadOnly]

    def get_object(self, pk, request):
        question = get_object_or_404(
            Question.objects.select_related("teacher"), pk=pk
        )
        self.check_object_permissions(request, question)
        return question

    def get(self, request, pk):
        question = self.get_object(pk, request)
        serializer = QuestionSerializer(question, context={"request": request})
        return api_response(
            success=True,
            message="Question details retrieved successfully.",
            data={"question": serializer.data},
            status_code=status.HTTP_200_OK,
        )

    def put(self, request, pk):
        question = self.get_object(pk, request)
        serializer = QuestionCreateUpdateSerializer(question, data=request.data)
        if serializer.is_valid():
            updated_question = serializer.save()
            output = QuestionSerializer(
                updated_question, context={"request": request}
            )
            return api_response(
                success=True,
                message="Question updated successfully.",
                data={"question": output.data},
                status_code=status.HTTP_200_OK,
            )
        return api_response(
            success=False,
            message="Failed to update question.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):
        question = self.get_object(pk, request)
        serializer = QuestionCreateUpdateSerializer(
            question, data=request.data, partial=True
        )
        if serializer.is_valid():
            updated_question = serializer.save()
            output = QuestionSerializer(
                updated_question, context={"request": request}
            )
            return api_response(
                success=True,
                message="Question updated partially.",
                data={"question": output.data},
                status_code=status.HTTP_200_OK,
            )
        return api_response(
            success=False,
            message="Failed to update question.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        question = self.get_object(pk, request)
        question_id = question.id
        question.delete()
        return api_response(
            success=True,
            message=f"Question #{question_id} deleted successfully.",
            data={"id": question_id},
            status_code=status.HTTP_200_OK,
        )
