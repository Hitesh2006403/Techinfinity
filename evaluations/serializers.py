from decimal import Decimal
from rest_framework import serializers
from .models import Evaluation, QuestionEvaluation


class QuestionEvaluationSerializer(serializers.ModelSerializer):
    question_number = serializers.CharField(source="question.number", read_only=True)
    question_text = serializers.CharField(source="question.text", read_only=True)

    class Meta:
        model = QuestionEvaluation
        fields = [
            "id", "question_number", "question_text", "student_answer", "expected_answer",
            "correct_points", "mistakes", "missing_concepts", "justification",
            "improvement_suggestions", "flags", "ai_marks", "awarded_marks", "maximum_marks",
            "criteria", "correct_concepts", "feedback", "evidence", "reference_evidence",
            "student_quote", "source_pages", "bbox_json", "confidence",
            "requires_teacher_review", "teacher_override_reason", "teacher_comments",
        ]


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
    question_evaluations = QuestionEvaluationSerializer(many=True, read_only=True)
    report_document = serializers.SerializerMethodField(read_only=True)
    report_url = serializers.SerializerMethodField(read_only=True)

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
            "status",
            "needs_attention",
            "teacher_approved_marks",
            "teacher_review_status",
            "teacher_comments",
            "evaluated_at",
            "reviewed_at",
            "approved_at",
            "approved_by",
            "published_at",
            "published_by",
            "question_evaluations",
            "report_document",
            "report_url",
            "model_name",
            "prompt_version",
        ]
        read_only_fields = fields

    def get_report_url(self, obj):
        if obj.report_document:
            return f"/api/evaluations/{obj.id}/report/download/"
        return None

    def get_report_document(self, obj):
        # Keep the historical field name as an authenticated API route, never a
        # direct storage or /media URL.
        return self.get_report_url(obj)

    def to_representation(self, instance):
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) == "STUDENT":
            if instance.published_at is None:
                return {
                    "id": instance.id,
                    "submission_id": instance.submission_id,
                    "status": "PENDING_TEACHER_REVIEW",
                    "message": "Awaiting teacher review",
                }
        return super().to_representation(instance)


class TeacherApproveSerializer(serializers.Serializer):
    """
    Serializer for teacher approving AI marks.
    """

    teacher_comments = serializers.CharField(
        required=False, allow_blank=True, default=""
    )


class TeacherUpdateMarksSerializer(serializers.Serializer):
    """
    Serializer for teacher modifying marks or saving draft review.
    """

    approved_marks = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal("0.0"), required=False
    )
    teacher_comments = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    feedback = serializers.CharField(required=False, allow_blank=True)
    question_evaluations = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )

    def validate_question_evaluations(self, value):
        evaluation = self.context.get("evaluation")
        if evaluation is None:
            raise serializers.ValidationError("Evaluation context is required.")
        result = []
        seen = set()
        for row in value:
            qid = row.get("id")
            if not isinstance(qid, int) or qid in seen:
                raise serializers.ValidationError("Each question result needs a unique valid id.")
            seen.add(qid)
            question_result = evaluation.question_evaluations.filter(pk=qid).first()
            if question_result is None:
                raise serializers.ValidationError("A question result does not belong to this evaluation.")
            cleaned = {"id": qid}
            if "awarded_marks" in row:
                try:
                    marks = Decimal(str(row["awarded_marks"]))
                except Exception:
                    raise serializers.ValidationError("Question marks must be numeric.")
                if not marks.is_finite() or marks < 0 or marks > question_result.maximum_marks:
                    raise serializers.ValidationError(
                        f"Marks for question {question_result.question.number} must be between 0 and {question_result.maximum_marks}."
                    )
                cleaned["awarded_marks"] = marks.quantize(Decimal("0.01"))
            for field in ("feedback", "teacher_override_reason", "teacher_comments"):
                if field in row:
                    if not isinstance(row[field], str):
                        raise serializers.ValidationError(f"{field} must be text.")
                    cleaned[field] = row[field]
            result.append(cleaned)
        return result

    def validate_approved_marks(self, value):
        evaluation = self.context.get("evaluation")
        if evaluation and value is not None and value > evaluation.max_marks:
            raise serializers.ValidationError(
                f"Approved marks ({value}) cannot exceed the maximum question marks ({evaluation.max_marks})."
            )
        return value
