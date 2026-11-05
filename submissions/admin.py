from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(ModelAdmin):
    list_display = (
        "id",
        "student",
        "question",
        "status_badge",
        "score_display",
        "submitted_at",
    )

    list_filter = (
        "status",
        "submitted_at",
        "question__subject",
    )

    search_fields = (
        "student__username",
        "student__email",
        "question__title",
        "question__subject",
        "answer_text",
    )

    ordering = ("-submitted_at",)
    list_per_page = 25
    autocomplete_fields = ("student", "question")
    readonly_fields = ("submitted_at",)

    fieldsets = (
        (
            _("Submission Information"),
            {
                "fields": (
                    "question",
                    "student",
                    "status",
                    "submitted_at",
                ),
            },
        ),
        (
            _("Student's Submitted Answer"),
            {
                    "fields": ("answer_text", "answer_document"),
            },
        ),
    )

    @display(
        description=_("Status"),
        label={
            "SUBMITTED": "warning",
            "EVALUATED": "info",
            "REVIEWED": "success",
        },
    )
    def status_badge(self, obj: Submission) -> str:
        return obj.status

    @display(description=_("Score (Final / Max)"))
    def score_display(self, obj: Submission) -> str:
        if hasattr(obj, "evaluation") and obj.evaluation is not None:
            final = obj.evaluation.final_marks
            return f"{final} / {obj.evaluation.max_marks}"
        return "Not Evaluated"
