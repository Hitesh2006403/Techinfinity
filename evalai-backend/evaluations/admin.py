from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import Evaluation


@admin.register(Evaluation)
class EvaluationAdmin(ModelAdmin):
    list_display = (
        "id",
        "submission_display",
        "suggested_marks",
        "teacher_approved_marks",
        "max_marks",
        "review_status_badge",
        "confidence_percentage",
        "evaluated_at",
    )

    list_filter = (
        "teacher_review_status",
        "evaluated_at",
        "reviewed_at",
    )

    search_fields = (
        "submission__student__username",
        "submission__question__title",
        "submission__question__subject",
        "feedback",
        "reasoning",
    )

    ordering = ("-evaluated_at",)
    list_per_page = 20
    readonly_fields = (
        "submission",
        "suggested_marks",
        "max_marks",
        "confidence",
        "concepts_found",
        "missing_concepts",
        "incorrect_concepts",
        "criterion_wise_marks",
        "reasoning",
        "evaluated_at",
        "reviewed_at",
    )

    fieldsets = (
        (
            _("AI Scoring Overview"),
            {
                "fields": (
                    "submission",
                    "suggested_marks",
                    "max_marks",
                    "confidence",
                    "evaluated_at",
                ),
            },
        ),
        (
            _("Teacher Verification & Adjustment"),
            {
                "fields": (
                    "teacher_review_status",
                    "teacher_approved_marks",
                    "teacher_comments",
                    "reviewed_at",
                ),
            },
        ),
        (
            _("Explainable Semantic Analysis"),
            {
                "fields": (
                    "concepts_found",
                    "missing_concepts",
                    "incorrect_concepts",
                    "criterion_wise_marks",
                    "reasoning",
                    "feedback",
                ),
            },
        ),
    )

    @display(description=_("Submission"))
    def submission_display(self, obj: Evaluation) -> str:
        return f"Sub #{obj.submission_id} - {obj.submission.student.username} ({obj.submission.question.title[:25]})"

    @display(
        description=_("Review Status"),
        label={
            "PENDING": "warning",
            "APPROVED": "success",
            "MODIFIED": "info",
        },
    )
    def review_status_badge(self, obj: Evaluation) -> str:
        return obj.teacher_review_status

    @display(description=_("AI Confidence"))
    def confidence_percentage(self, obj: Evaluation) -> str:
        return f"{int(obj.confidence * 100)}%"
