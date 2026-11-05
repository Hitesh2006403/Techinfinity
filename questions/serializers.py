from rest_framework import serializers
from .models import Question, SubjectResource


class SubjectResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectResource
        fields = [
            "id", "name", "reference_notes", "evaluation_scheme",
            "notes_description", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class QuestionSerializer(serializers.ModelSerializer):
    """
    Comprehensive question serializer.
    Includes teacher metadata and dynamically redacts reference answers for students.
    """

    teacher_username = serializers.CharField(
        source="teacher.username", read_only=True
    )
    teacher_name = serializers.SerializerMethodField(read_only=True)
    submissions_count = serializers.IntegerField(
        source="submissions.count", read_only=True
    )

    class Meta:
        model = Question
        fields = [
            "id",
            "teacher",
            "teacher_username",
            "teacher_name",
            "subject",
            "title",
            "question_text",
            "reference_answer",
            "max_marks",
            "marking_rubric",
            "submissions_count",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = [
            "id",
            "teacher",
            "teacher_username",
            "teacher_name",
            "submissions_count",
            "created_at",
            "updated_at",
        ]

    def get_teacher_name(self, obj) -> str:
        return obj.teacher.get_full_name() or obj.teacher.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        # Pedagogical protection: do not leak model reference answer or rubric to students
        if request and request.user.is_authenticated:
            if getattr(request.user, "role", None) == "STUDENT" and not (
                request.user.is_staff or request.user.is_superuser
            ):
                data.pop("reference_answer", None)
                data.pop("marking_rubric", None)
        return data


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used for creating and updating questions.
    """

    class Meta:
        model = Question
        fields = [
            "subject",
            "title",
            "question_text",
            "reference_answer",
            "max_marks",
            "marking_rubric",
            "is_active",
        ]

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Maximum marks must be a positive number greater than 0."
            )
        return value

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank or whitespace.")
        return value.strip()

    def validate_question_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Question text cannot be blank.")
        return value.strip()

    def validate_reference_answer(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Reference answer is required for AI evaluation."
            )
        return value.strip()
