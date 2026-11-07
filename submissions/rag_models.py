from django.db import models

from .models import Submission
from questions.rag_models import ExtractedQuestion, ProcessingStatus


class ExtractedStudentAnswer(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="extracted_answers")
    question = models.ForeignKey(ExtractedQuestion, on_delete=models.CASCADE, related_name="student_answers")
    answer_text = models.TextField(blank=True, default="")
    confidence = models.FloatField(default=0.0)
    processing_status = models.CharField(max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.PENDING)
    processing_error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

