from django.db import models
from django.conf import settings
from questions.models import Question
from questions.models import SubjectResource
from accounts.models import User


class UploadedAnswerSheet(models.Model):
    """Raw teacher-uploaded answer document awaiting later processing."""

    class DocumentType(models.TextChoices):
        ANSWER_SHEET = "ANSWER_SHEET", "Student answer sheet"
        QUESTION_PAPER = "QUESTION_PAPER", "Exam question paper"

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_answer_sheets",
    )
    subject = models.ForeignKey(
        SubjectResource,
        on_delete=models.CASCADE,
        related_name="answer_sheets",
        null=True,
        blank=True,
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="uploaded_answer_sheets_as_student",
        limit_choices_to={"role": "STUDENT"},
        null=True,
        blank=True,
    )
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        default=DocumentType.ANSWER_SHEET,
        db_index=True,
    )
    document = models.FileField(upload_to="answer_sheets/inbox/")
    submission = models.OneToOneField(
        "Submission",
        on_delete=models.SET_NULL,
        related_name="source_answer_sheet",
        null=True,
        blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.document.name


class Submission(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "UPLOADED", "Uploaded"
        PROCESSING = "PROCESSING", "Processing"
        AI_EVALUATED = "AI_EVALUATED", "AI Evaluated"
        PENDING_TEACHER_REVIEW = "PENDING_TEACHER_REVIEW", "Pending Teacher Review"
        APPROVED = "APPROVED", "Approved"
        PUBLISHED = "PUBLISHED", "Published"
        FAILED = "FAILED", "Failed"
        # Legacy status choices for backward compatibility with existing tests
        SUBMITTED = "SUBMITTED", "Submitted"
        EVALUATED = "EVALUATED", "Evaluated"
        REVIEWED = "REVIEWED", "Reviewed"

    subject = models.ForeignKey(
        SubjectResource,
        on_delete=models.CASCADE,
        related_name="submissions",
        null=True,
        blank=True,
        help_text="The subject this answer sheet belongs to",
    )
    question_paper = models.ForeignKey(
        "questions.QuestionPaper",
        on_delete=models.SET_NULL,
        related_name="submissions",
        null=True,
        blank=True,
        help_text="Question paper version evaluated against",
    )
    reference_document = models.ForeignKey(
        "questions.ReferenceDocument",
        on_delete=models.SET_NULL,
        related_name="submissions",
        null=True,
        blank=True,
        help_text="The exact reference document version used for this evaluation.",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="submissions",
        help_text="The question being answered",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
        limit_choices_to={"role": "STUDENT"},
        help_text="The student who submitted this answer",
    )
    answer_text = models.TextField(
        blank=True,
        help_text="Student's descriptive answer content",
    )
    answer_document = models.FileField(
        upload_to="answer_sheets/",
        blank=True,
        null=True,
        help_text="Teacher-uploaded student answer sheet",
    )
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processing_started_at = models.DateTimeField(null=True, blank=True, db_index=True)
    extraction_metadata = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.UPLOADED,
        db_index=True,
        help_text="Current evaluation lifecycle status",
    )
    processing_error = models.TextField(
        blank=True,
        default="",
        help_text="Actionable error from answer extraction or AI processing.",
    )

    class Meta:
        ordering = ["-submitted_at"]
        verbose_name = "Submission"
        verbose_name_plural = "Submissions"
        indexes = [
            models.Index(fields=["subject", "student", "status"]),
            models.Index(fields=["student", "status"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Submission #{self.id} by {self.student.username} on '{self.question.title[:30]}'"


from .rag_models import ExtractedStudentAnswer  # noqa: E402,F401
