from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from submissions.models import Submission


class Evaluation(models.Model):
    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved"
        MODIFIED = "MODIFIED", "Modified"

    submission = models.OneToOneField(
        Submission,
        on_delete=models.CASCADE,
        related_name="evaluation",
        help_text="The submission that was evaluated by AI",
    )
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
