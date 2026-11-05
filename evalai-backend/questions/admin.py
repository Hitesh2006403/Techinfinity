from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import Question


@admin.register(Question)
class QuestionAdmin(ModelAdmin):
    list_display = (
        "title",
        "subject",
        "teacher",
        "max_marks",
        "submissions_badge",
        "is_active",
        "created_at",
    )

    list_filter = (
        "subject",
        "is_active",
        "created_at",
        "teacher",
    )

    search_fields = (
        "title",
        "question_text",
        "subject",
        "teacher__username",
        "teacher__first_name",
        "teacher__last_name",
    )

    ordering = ("-created_at",)
    list_per_page = 20
    autocomplete_fields = ("teacher",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("General Information"),
            {
                "fields": (
                    "title",
                    "subject",
                    "teacher",
                    "is_active",
                ),
            },
        ),
        (
            _("Question & Reference Answer"),
            {
                "fields": (
                    "question_text",
                    "reference_answer",
                ),
            },
        ),
        (
            _("Marking Criteria & Rubric"),
            {
                "fields": (
                    "max_marks",
                    "marking_rubric",
                ),
            },
        ),
        (
            _("Audit Timestamps"),
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ["collapse"],
            },
        ),
    )

    @display(description=_("Submissions"))
    def submissions_badge(self, obj: Question) -> int:
        return obj.submissions.count()
