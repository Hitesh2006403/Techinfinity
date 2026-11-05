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
        SUBMITTED = "SUBMITTED", "Submitted"
        EVALUATED = "EVALUATED", "Evaluated"
        REVIEWED = "REVIEWED", "Reviewed"

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
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
        db_index=True,
        help_text="Current evaluation lifecycle status",
    )

    class Meta:
        ordering = ["-submitted_at"]
        verbose_name = "Submission"
        verbose_name_plural = "Submissions"

    def __str__(self):
        return f"Submission #{self.id} by {self.student.username} on '{self.question.title[:30]}'"
