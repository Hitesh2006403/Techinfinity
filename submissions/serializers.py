from pathlib import Path

from rest_framework import serializers
from .models import Submission, UploadedAnswerSheet
from questions.models import Question, SubjectResource
from accounts.models import User
from evaluations.models import Evaluation
from rag.validation import validate_document_upload, validate_pdf_upload, validate_answer_sheet_upload


class TeacherAnswerSheetUploadSerializer(serializers.Serializer):
    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.filter(is_active=True), write_only=True
    )
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.STUDENT), write_only=True
    )
    answer_document = serializers.FileField()
    answer_text = serializers.CharField(required=False, allow_blank=True)

    def validate_answer_document(self, value):
        return validate_document_upload(value)


class RawAnswerSheetUploadSerializer(serializers.ModelSerializer):
    document = serializers.FileField(write_only=True)

    class Meta:
        model = UploadedAnswerSheet
        fields = ["id", "document_type", "subject", "student", "document", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]

    def validate_document(self, value):
        return validate_document_upload(value)


class MappedAnswerSheetUploadSerializer(serializers.Serializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        source="subject", queryset=SubjectResource.objects.all(), write_only=True
    )
    student_id = serializers.PrimaryKeyRelatedField(
        source="student", queryset=User.objects.filter(role=User.Role.STUDENT), write_only=True
    )
    document = serializers.FileField()

    def validate_document(self, value):
        return validate_document_upload(value)


class EadaesMappedAnswerSheetUploadSerializer(MappedAnswerSheetUploadSerializer):
    def validate_document(self, value):
        # Question/reference documents are PDFs, but student scripts may be
        # scanned PDFs or individual camera images.
        value = validate_document_upload(value)
        if Path(value.name).suffix.lower() not in {".pdf", ".png", ".jpg", ".jpeg", ".webp"}:
            raise serializers.ValidationError(
                "Answer sheets must be PDF, PNG, JPG, JPEG, or WEBP files."
            )
        return value


class UnifiedAnswerSheetUploadSerializer(MappedAnswerSheetUploadSerializer):
    """Strict format validation for the active subject workflow endpoint."""

    def validate_document(self, value):
        return validate_answer_sheet_upload(value)


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
        fields = ["question_id", "answer_text", "answer_document"]
        extra_kwargs = {"answer_text": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        if not attrs.get("answer_text", "").strip() and not attrs.get("answer_document"):
            raise serializers.ValidationError(
                "Provide an answer or upload an answer-sheet document."
            )
        return attrs

    def validate_answer_text(self, value):
        cleaned = value.strip()
        if not cleaned:
            return cleaned
        if len(cleaned) < 10:
            raise serializers.ValidationError(
                "Answer is too short. Please provide a descriptive response."
            )
        return cleaned

    def validate_answer_document(self, value):
        return validate_document_upload(value)


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
    final_marks = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    teacher_review_status = serializers.CharField(read_only=True)
    confidence = serializers.FloatField(read_only=True)
    feedback = serializers.CharField(read_only=True)
    concepts_found = serializers.ListField(read_only=True)
    missing_concepts = serializers.ListField(read_only=True)
    incorrect_concepts = serializers.ListField(read_only=True)
    criterion_wise_marks = serializers.ListField(read_only=True)
    reasoning = serializers.CharField(read_only=True)
    teacher_comments = serializers.CharField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)
    report_document = serializers.FileField(write_only=True)
    report_url = serializers.SerializerMethodField(read_only=True)
    question_evaluations = serializers.SerializerMethodField()

    def get_report_url(self, obj):
        if obj.report_document:
            return f"/api/evaluations/{obj.id}/report/download/"
        return None

    def get_question_evaluations(self, evaluation):
        return [
            {
                "id": item.id,
                "question_number": item.question.number,
                "question_text": item.question.text,
                "student_answer": item.student_answer,
                "expected_answer": item.expected_answer,
                "correct_points": item.correct_points,
                "mistakes": item.mistakes,
                "missing_concepts": item.missing_concepts,
                "justification": item.justification,
                "improvement_suggestions": item.improvement_suggestions,
                "flags": item.flags,
                "ai_marks": item.ai_marks,
                "awarded_marks": item.awarded_marks,
                "maximum_marks": item.maximum_marks,
                "criteria": item.criteria,
                "correct_concepts": item.correct_concepts,
                "feedback": item.feedback,
                "evidence": item.evidence,
                "reference_evidence": item.reference_evidence,
                "student_quote": item.student_quote,
                "source_pages": item.source_pages,
                "bbox": item.bbox_json,
                "confidence": item.confidence,
                "requires_teacher_review": item.requires_teacher_review,
                "teacher_override_reason": item.teacher_override_reason,
                "teacher_comments": item.teacher_comments,
            }
            for item in evaluation.question_evaluations.select_related("question").all()
        ]
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
    answer_sheet_url = serializers.SerializerMethodField(read_only=True)
    answer_sheet_preview_url = serializers.SerializerMethodField(read_only=True)
    answer_document = serializers.FileField(write_only=True, required=False)

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
            "answer_document",
            "answer_sheet_url",
            "answer_sheet_preview_url",
            "max_marks",
            "submitted_at",
            "status",
            "processing_error",
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
            "answer_sheet_url",
            "answer_sheet_preview_url",
            "max_marks",
            "submitted_at",
            "status",
            "processing_error",
            "evaluation",
        ]

    def to_representation(self, instance):
        request = self.context.get("request")
        try:
            has_evaluation = instance.evaluation is not None
        except Evaluation.DoesNotExist:
            has_evaluation = False
        if (
            request
            and getattr(request.user, "role", None) == "STUDENT"
        ):
            is_published = (
                has_evaluation
                and instance.status == Submission.Status.PUBLISHED
                and instance.evaluation.published_at is not None
            )
            if not is_published:
                return {
                    "id": instance.id,
                    "status": instance.status,
                    "message": "Awaiting teacher review",
                }
        return super().to_representation(instance)

    def get_student_name(self, obj) -> str:
        return obj.student.get_full_name() or obj.student.username

    def get_answer_sheet_url(self, obj):
        if obj.answer_document:
            return f"/api/submissions/{obj.id}/answer-sheet/download/"
        return None

    def get_answer_sheet_preview_url(self, obj):
        if obj.answer_document:
            return f"/api/submissions/{obj.id}/answer-sheet/preview/?page=1"
        return None

    def get_evaluation(self, obj):
        if hasattr(obj, "evaluation") and obj.evaluation is not None:
            request = self.context.get("request")
            if request and getattr(request.user, "role", None) == "STUDENT":
                # Students NEVER see marks or feedback before publish
                if obj.evaluation.published_at is None:
                    return None
            return SubmissionEvaluationPreviewSerializer(obj.evaluation, context=self.context).data
        return None
