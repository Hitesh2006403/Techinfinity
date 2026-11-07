from celery import shared_task
from pathlib import Path
from decimal import Decimal


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=2)
def process_eadaes_document(self, document_id):
    """Process one canonical subject PDF in the background."""
    from questions.rag_models import Document
    from questions.models import Exam
    from rag.services import (
        process_marking_scheme,
        process_question_paper,
        process_reference_document,
    )

    document = Document.objects.select_related("subject").get(pk=document_id)
    if document.kind == Document.Kind.REFERENCE:
        process_reference_document(document.subject, document.file)
    elif document.kind == Document.Kind.QUESTION_PAPER:
        exam_name = f"{Path(document.file.name).stem} examination"
        exam, _ = Exam.objects.get_or_create(
            subject=document.subject,
            name=exam_name[:200],
            defaults={"total_marks": Decimal("0.01")},
        )
        process_question_paper(document.subject, document.file, exam=exam)
        total = sum((item.maximum_marks or Decimal("0.00") for paper in document.subject.question_papers.order_by("-uploaded_at")[:1] for item in paper.questions.all()), Decimal("0.00"))
        if total > 0:
            exam.total_marks = total
            exam.save(update_fields=["total_marks", "updated_at"])
    elif document.kind == Document.Kind.MARKING_SCHEME:
        process_marking_scheme(document.subject, document.file)
    else:
        raise ValueError("Answer sheets must be submitted through the mapped answer-sheet workflow.")
    document.refresh_from_db()
    return {"document_id": document.id, "status": document.status}
