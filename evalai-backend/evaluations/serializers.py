from decimal import Decimal
from rest_framework import serializers
from .models import Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for AI Evaluation results and teacher review data.
    """

    submission_id = serializers.IntegerField(
        source="submission.id", read_only=True
    )
    student_id = serializers.IntegerField(
        source="submission.student.id", read_only=True
    )
    student_username = serializers.CharField(
        source="submission.student.username", read_only=True
    )
    question_id = serializers.IntegerField(
        source="submission.question.id", read_only=True
    )
    question_title = serializers.CharField(
        source="submission.question.title", read_only=True
    )
    final_marks = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "submission_id",
            "student_id",
            "student_username",
            "question_id",
            "question_title",
            "suggested_marks",
            "max_marks",
            "final_marks",
            "feedback",
            "concepts_found",
            "missing_concepts",
            "incorrect_concepts",
            "criterion_wise_marks",
            "reasoning",
            "confidence",
            "teacher_approved_marks",
            "teacher_review_status",
            "teacher_comments",
            "evaluated_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "id",
            "submission_id",
            "student_id",
            "student_username",
            "question_id",
            "question_title",
            "suggested_marks",
            "max_marks",
            "final_marks",
            "feedback",
            "concepts_found",
            "missing_concepts",
            "incorrect_concepts",
            "criterion_wise_marks",
            "reasoning",
            "confidence",
            "teacher_approved_marks",
            "teacher_review_status",
            "teacher_comments",
            "evaluated_at",
            "reviewed_at",
        ]


class TeacherApproveSerializer(serializers.Serializer):
    """
    Serializer for teacher approving AI marks.
    """

    teacher_comments = serializers.CharField(
        required=False, allow_blank=True, default=""
    )


class TeacherUpdateMarksSerializer(serializers.Serializer):
    """
    Serializer for teacher modifying marks.
    """

    approved_marks = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal("0.0"), required=True
    )
    teacher_comments = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    def validate_approved_marks(self, value):
        evaluation = self.context.get("evaluation")
        if evaluation and value > evaluation.max_marks:
            raise serializers.ValidationError(
                f"Approved marks ({value}) cannot exceed the maximum question marks ({evaluation.max_marks})."
            )
        return value
