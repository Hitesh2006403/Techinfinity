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
    code = models.CharField(max_length=50, blank=True, default="", db_index=True)
    semester = models.CharField(max_length=50, blank=True, default="")
    academic_year = models.CharField(max_length=50, blank=True, default="")
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


class Enrollment(models.Model):
    """Explicit student membership in a teacher-owned subject."""

    subject = models.ForeignKey(SubjectResource, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subject_enrollments",
        limit_choices_to={"role": "STUDENT"},
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["student__username"]
        constraints = [
            models.UniqueConstraint(fields=["subject", "student"], name="unique_subject_student_enrollment")
        ]


class Exam(models.Model):
    """A question paper/exam configuration scoped to one subject."""

    class Strictness(models.TextChoices):
        LENIENT = "lenient", "Lenient"
        STANDARD = "standard", "Standard"
        STRICT = "strict", "Strict"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        READY = "ready", "Ready for answer sheets"
        ARCHIVED = "archived", "Archived"

    subject = models.ForeignKey(SubjectResource, on_delete=models.CASCADE, related_name="exams")
    name = models.CharField(max_length=200)
    total_marks = models.DecimalField(max_digits=7, decimal_places=2)
    strictness = models.CharField(max_length=20, choices=Strictness.choices, default=Strictness.STANDARD)
    answer_convention_text = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["subject", "name"], name="unique_subject_exam_name")
        ]

    def __str__(self):
        return f"{self.subject.name}: {self.name}"


class Question(models.Model):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="questions",
        limit_choices_to={"role": "TEACHER"},
        help_text="The teacher who created and manages this question",
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name="questions",
        null=True,
        blank=True,
        help_text="EADAES exam assignment; nullable for legacy question records.",
    )
    parent = models.ForeignKey("self", on_delete=models.CASCADE, related_name="sub_questions", null=True, blank=True)
    choice_group = models.CharField(max_length=80, blank=True, default="")
    source_page = models.PositiveIntegerField(null=True, blank=True)
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


# Keep the RAG entities in a focused module while allowing Django to discover them.
from .rag_models import ExtractedQuestion, QuestionPaper, ReferenceChunk, ReferenceDocument  # noqa: E402,F401
