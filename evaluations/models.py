from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from submissions.models import Submission
from questions.models import Question
from questions.rag_models import ExtractedQuestion


class Evaluation(models.Model):
    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved"
        MODIFIED = "MODIFIED", "Modified"

    class Status(models.TextChoices):
        UPLOADED = "UPLOADED", "Uploaded"
        PROCESSING = "PROCESSING", "Processing"
        AI_EVALUATED = "AI_EVALUATED", "AI Evaluated"
        PENDING_TEACHER_REVIEW = "PENDING_TEACHER_REVIEW", "Pending Teacher Review"
        APPROVED = "APPROVED", "Approved"
        PUBLISHED = "PUBLISHED", "Published"
        FAILED = "FAILED", "Failed"

    submission = models.OneToOneField(
        Submission,
        on_delete=models.CASCADE,
        related_name="evaluation",
        help_text="The submission that was evaluated by AI",
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_TEACHER_REVIEW,
        db_index=True,
    )
    needs_attention = models.BooleanField(default=False, db_index=True)
    suggested_marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.0"))],
        help_text="AI suggested marks based on semantic rubric comparison",
    )
    max_marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.5"))],
        help_text="Maximum total marks for this evaluation",
    )
    feedback = models.TextField(
        help_text="Constructive, pedagogical feedback for the student",
    )
    concepts_found = models.JSONField(
        default=list,
        blank=True,
        help_text="Correct concepts demonstrated in the answer",
    )
    missing_concepts = models.JSONField(
        default=list,
        blank=True,
        help_text="Critical concepts absent from the answer",
    )
    incorrect_concepts = models.JSONField(
        default=list,
        blank=True,
        help_text="Misconceptions or factual errors identified",
    )
    criterion_wise_marks = models.JSONField(
        default=list,
        blank=True,
        help_text="Criterion breakdown with awarded marks, max marks, and reasons",
    )
    reasoning = models.TextField(
        blank=True,
        default="",
        help_text="Explainable reasoning justifying the marks awarded",
    )
    confidence = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="AI confidence estimate between 0.0 and 1.0",
    )
    teacher_approved_marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.0"))],
        help_text="Final marks approved or modified by the teacher",
    )
    teacher_review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
        db_index=True,
        help_text="Status of teacher verification on this AI evaluation",
    )
    teacher_comments = models.TextField(
        blank=True,
        default="",
        help_text="Teacher's remarks or explanation for mark modification",
    )
    evaluated_at = models.DateTimeField(auto_now_add=True, db_index=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    report_document = models.FileField(
        upload_to="evaluation_reports/",
        null=True,
        blank=True,
        help_text="Generated evaluation report for teacher review and approved student delivery.",
    )
    model_name = models.CharField(max_length=150, blank=True, default="")
    prompt_version = models.CharField(max_length=80, blank=True, default="")
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_evaluations",
    )
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_evaluations",
    )

    class Meta:
        ordering = ["-evaluated_at"]
        verbose_name = "AI Evaluation"
        verbose_name_plural = "AI Evaluations"

    def clean(self):
        super().clean()
        if self.suggested_marks is not None and self.max_marks is not None:
            if self.suggested_marks > self.max_marks:
                raise ValidationError(
                    {"suggested_marks": "Suggested marks cannot exceed maximum marks."}
                )
        if self.teacher_approved_marks is not None and self.max_marks is not None:
            if self.teacher_approved_marks > self.max_marks:
                raise ValidationError(
                    {
                        "teacher_approved_marks": "Teacher approved marks cannot exceed maximum marks."
                    }
                )

    @property
    def final_marks(self):
        """Returns approved marks if reviewed; otherwise suggested marks."""
        if self.teacher_approved_marks is not None:
            return self.teacher_approved_marks
        return self.suggested_marks

    def __str__(self):
        return f"Evaluation #{self.id} for Submission #{self.submission_id} [{self.teacher_review_status}]"


class Rubric(models.Model):
    """Teacher-approved grading contract used by the evaluator."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        APPROVED = "approved", "Approved"

    question = models.OneToOneField(Question, on_delete=models.CASCADE, related_name="rubric")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    model_answer = models.TextField(blank=True, default="")
    approved_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_rubrics"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class RubricPoint(models.Model):
    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name="points")
    order = models.PositiveIntegerField(default=0)
    text = models.TextField()
    marks = models.DecimalField(max_digits=6, decimal_places=2)
    keywords = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["order", "id"]


class QuestionEvaluation(models.Model):
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE, related_name="question_evaluations")
    question = models.ForeignKey(ExtractedQuestion, on_delete=models.CASCADE, related_name="evaluations")
    student_answer = models.TextField(blank=True, default="")
    expected_answer = models.TextField(blank=True, default="")
    correct_points = models.JSONField(default=list, blank=True)
    mistakes = models.JSONField(default=list, blank=True)
    missing_concepts = models.JSONField(default=list, blank=True)
    evidence = models.JSONField(default=list, blank=True)
    reference_evidence = models.JSONField(default=list, blank=True)
    ai_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    awarded_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    maximum_marks = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    justification = models.TextField(blank=True, default="")
    improvement_suggestions = models.JSONField(default=list, blank=True)
    flags = models.JSONField(default=list, blank=True)
    criteria = models.JSONField(default=list, blank=True)
    correct_concepts = models.JSONField(default=list, blank=True)
    feedback = models.TextField(blank=True, default="")
    student_quote = models.TextField(blank=True, default="")
    source_pages = models.JSONField(default=list, blank=True)
    bbox_json = models.JSONField(default=list, blank=True)
    confidence = models.FloatField(default=0.0)
    requires_teacher_review = models.BooleanField(default=False)
    teacher_override_reason = models.TextField(blank=True, default="")
    teacher_comments = models.TextField(blank=True, default="")
