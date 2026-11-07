from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import Question
from .rag_models import ExtractedQuestion, QuestionPaper, ReferenceChunk, ReferenceDocument


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


@admin.register(ReferenceDocument)
class ReferenceDocumentAdmin(ModelAdmin):
    list_display = ("subject", "processing_status", "version", "uploaded_at")
    list_filter = ("processing_status", "uploaded_at")
    search_fields = ("subject__name", "subject__teacher__username")
    readonly_fields = ("extracted_text", "processing_error", "uploaded_at")


@admin.register(ReferenceChunk)
class ReferenceChunkAdmin(ModelAdmin):
    list_display = ("document", "chunk_index", "page_number", "question_number")
    list_filter = ("document__subject",)
    search_fields = ("text", "question_number")
    readonly_fields = ("embedding",)


@admin.register(QuestionPaper)
class QuestionPaperAdmin(ModelAdmin):
    list_display = ("subject", "processing_status", "uploaded_at")
    list_filter = ("processing_status", "uploaded_at")
    search_fields = ("subject__name", "extracted_text")
    readonly_fields = ("extracted_text", "processing_error", "uploaded_at")


@admin.register(ExtractedQuestion)
class ExtractedQuestionAdmin(ModelAdmin):
    list_display = ("number", "question_paper", "maximum_marks", "page_number")
    search_fields = ("number", "text", "question_paper__subject__name")
