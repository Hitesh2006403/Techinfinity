from django.db import models
from django.conf import settings
from questions.models import Question


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
        help_text="Student's descriptive answer content",
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
