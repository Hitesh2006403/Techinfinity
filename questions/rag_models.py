import hashlib

from django.conf import settings
from django.db import models
from pgvector.django import VectorField

from .models import SubjectResource


class ProcessingStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"


class Document(models.Model):
    """Canonical subject-scoped source document for the EADAES pipeline."""

    class Kind(models.TextChoices):
        QUESTION_PAPER = "question_paper", "Question paper"
        REFERENCE = "reference", "Reference material"
        MARKING_SCHEME = "marking_scheme", "Marking scheme"
        ANSWER_SHEET = "answer_sheet", "Student answer sheet"

    subject = models.ForeignKey(SubjectResource, on_delete=models.CASCADE, related_name="documents")
    kind = models.CharField(max_length=30, choices=Kind.choices)
    file = models.FileField(upload_to="documents/")
    file_hash = models.CharField(max_length=64, db_index=True)
    status = models.CharField(max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.PENDING)
    page_count = models.PositiveIntegerField(default=0)
    error = models.TextField(blank=True, default="")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="eadaes_documents")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["subject", "kind", "file_hash"], name="unique_subject_document_hash")
        ]

    @staticmethod
    def hash_bytes(data):
        return hashlib.sha256(data).hexdigest()


class DocumentPage(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="pages")
    page_no = models.PositiveIntegerField()
    text = models.TextField(blank=True, default="")
    image_path = models.CharField(max_length=500, blank=True, default="")
    is_handwritten = models.BooleanField(default=False)
    ocr_confidence = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["page_no"]
        constraints = [
            models.UniqueConstraint(fields=["document", "page_no"], name="unique_document_page")
        ]


class Chunk(models.Model):
    subject = models.ForeignKey(SubjectResource, on_delete=models.CASCADE, related_name="document_chunks")
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="chunks")
    page_no = models.PositiveIntegerField(null=True, blank=True)
    text = models.TextField()
    embedding = models.JSONField(default=list, blank=True)
    embedding_vector = VectorField(dimensions=384, null=True, blank=True)
    bbox_json = models.JSONField(default=list, blank=True)
    token_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class ProcessingEvent(models.Model):
    subject = models.ForeignKey(SubjectResource, on_delete=models.CASCADE, related_name="processing_events")
    entity_type = models.CharField(max_length=80)
    entity_id = models.PositiveBigIntegerField()
    stage = models.CharField(max_length=80)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class ReferenceDocument(models.Model):
    subject = models.ForeignKey(SubjectResource, on_delete=models.CASCADE, related_name="reference_documents")
    document = models.FileField(upload_to="reference_documents/")
    extracted_text = models.TextField(blank=True, default="")
    processing_status = models.CharField(max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.PENDING)
    processing_error = models.TextField(blank=True, default="")
    version = models.PositiveIntegerField(default=1)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]


class ReferenceChunk(models.Model):
    document = models.ForeignKey(ReferenceDocument, on_delete=models.CASCADE, related_name="chunks")
    chunk_index = models.PositiveIntegerField()
    text = models.TextField()
    page_number = models.PositiveIntegerField(null=True, blank=True)
    question_number = models.CharField(max_length=50, blank=True, default="")
    embedding = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["chunk_index"]
        constraints = [
            models.UniqueConstraint(fields=["document", "chunk_index"], name="unique_reference_chunk")
        ]


class QuestionPaper(models.Model):
    subject = models.ForeignKey(SubjectResource, on_delete=models.CASCADE, related_name="question_papers")
    document = models.FileField(upload_to="question_papers/")
    extracted_text = models.TextField(blank=True, default="")
    processing_status = models.CharField(max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.PENDING)
    processing_error = models.TextField(blank=True, default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ExtractedQuestion(models.Model):
    question_paper = models.ForeignKey(QuestionPaper, on_delete=models.CASCADE, related_name="questions")
    number = models.CharField(max_length=50)
    text = models.TextField()
    maximum_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    page_number = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["id"]

