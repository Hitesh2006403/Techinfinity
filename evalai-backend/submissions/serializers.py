from rest_framework import serializers
from .models import Submission
from questions.models import Question


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for students submitting descriptive answers to questions.
    """

    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.filter(is_active=True),
        source="question",
        write_only=True,
    )

    class Meta:
        model = Submission
        fields = ["question_id", "answer_text"]

    def validate_answer_text(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError(
                "Answer content cannot be empty or blank."
            )
        if len(cleaned) < 10:
            raise serializers.ValidationError(
                "Answer is too short. Please provide a descriptive response."
            )
        return cleaned


class SubmissionEvaluationPreviewSerializer(serializers.Serializer):
    """
    Lightweight serializer for embedding evaluation results inside submission details.
    """

    id = serializers.IntegerField(read_only=True)
    suggested_marks = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    max_marks = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    teacher_approved_marks = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    teacher_review_status = serializers.CharField(read_only=True)
    confidence = serializers.FloatField(read_only=True)
    feedback = serializers.CharField(read_only=True)
    evaluated_at = serializers.DateTimeField(read_only=True)


class SubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for listing and retrieving submissions.
    """

    student_username = serializers.CharField(
        source="student.username", read_only=True
    )
    student_name = serializers.SerializerMethodField(read_only=True)
    question_title = serializers.CharField(
        source="question.title", read_only=True
    )
    question_subject = serializers.CharField(
        source="question.subject", read_only=True
    )
    max_marks = serializers.DecimalField(
        source="question.max_marks",
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    evaluation = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "question",
            "question_title",
            "question_subject",
            "student",
            "student_username",
            "student_name",
            "answer_text",
            "max_marks",
            "submitted_at",
            "status",
            "evaluation",
        ]
        read_only_fields = [
            "id",
            "question",
            "question_title",
            "question_subject",
            "student",
            "student_username",
            "student_name",
            "max_marks",
            "submitted_at",
            "status",
            "evaluation",
        ]

    def get_student_name(self, obj) -> str:
        return obj.student.get_full_name() or obj.student.username

    def get_evaluation(self, obj):
        if hasattr(obj, "evaluation"):
            return SubmissionEvaluationPreviewSerializer(obj.evaluation).data
        return None
