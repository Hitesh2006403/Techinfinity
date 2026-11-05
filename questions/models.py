from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class SubjectResource(models.Model):
    """Teacher-owned reference notes and evaluation scheme for a subject."""

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subject_resources",
        limit_choices_to={"role": "TEACHER"},
    )
    name = models.CharField(max_length=150, db_index=True)
    reference_notes = models.FileField(upload_to="subject_notes/", blank=True, null=True)
    evaluation_scheme = models.FileField(upload_to="evaluation_schemes/", blank=True, null=True)
    notes_description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["teacher", "name"], name="unique_teacher_subject_resource"
            )
        ]

    def __str__(self):
        return self.name


class Question(models.Model):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="questions",
        limit_choices_to={"role": "TEACHER"},
        help_text="The teacher who created and manages this question",
    )
    subject = models.CharField(
        max_length=150,
        db_index=True,
        help_text="Academic subject or course domain (e.g., Computer Science, Physics)",
    )
    title = models.CharField(
        max_length=255,
        help_text="Concise title of the descriptive question",
    )
    question_text = models.TextField(
        help_text="The full descriptive question prompt given to students",
    )
    reference_answer = models.TextField(
        help_text="Model/reference answer containing key concepts for AI comparison",
    )
    max_marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.5"))],
        help_text="Maximum marks allocated for this question",
    )
    marking_rubric = models.TextField(
        blank=True,
        default="",
        help_text="Detailed grading guidelines and mark distribution across key criteria",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this question is currently open for student submissions",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Question"
        verbose_name_plural = "Questions"

    def __str__(self):
        return f"[{self.subject}] {self.title} (Max: {self.max_marks})"
