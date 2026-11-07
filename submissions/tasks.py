from celery import shared_task
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=2)
def process_uploaded_submission(self, submission_id, question_paper_id=None):
    """Extract, evaluate, and create the review report in the background."""
    from evaluations.services import EvaluationServiceError, evaluate_submission
    from questions.rag_models import QuestionPaper
    from submissions.models import Submission
    from submissions.state import transition_submission
    from rag.services import process_student_answers

    try:
        # Claim work while holding the submission row lock. A duplicate Celery
        # delivery sees PROCESSING or a completed state and exits before it can
        # create a second evaluation for the OneToOne submission.
        with transaction.atomic():
            submission = Submission.objects.select_for_update().select_related(
                "question", "subject", "question_paper", "reference_document"
            ).get(pk=submission_id)
            existing_evaluation = getattr(submission, "evaluation", None)
            if existing_evaluation is not None and submission.status != Submission.Status.FAILED:
                return {"submission_id": submission.id, "evaluation_id": existing_evaluation.id, "duplicate": True}
            if submission.status == Submission.Status.PROCESSING:
                return {"submission_id": submission.id, "status": "PROCESSING", "duplicate": True}
            if submission.status not in {
                Submission.Status.UPLOADED,
                Submission.Status.FAILED,
                Submission.Status.SUBMITTED,
            }:
                return {"submission_id": submission.id, "status": submission.status, "duplicate": True}
            transition_submission(submission, Submission.Status.PROCESSING)

        if question_paper_id is not None:
            question_paper = QuestionPaper.objects.get(pk=question_paper_id)
        else:
            question_paper = submission.question_paper or QuestionPaper.objects.filter(
                subject=submission.subject
            ).order_by("-uploaded_at").first()
        if question_paper is None:
            raise EvaluationServiceError("No processed question paper is linked to this submission.")

        extraction_error = ""
        process_student_answers(submission, question_paper)
        if not submission.answer_text.strip():
            extraction_error = (submission.extraction_metadata or {}).get("processing_error")
            raise EvaluationServiceError(
                extraction_error or "No readable answer text was extracted from the uploaded document."
            )
        evaluation = evaluate_submission(submission)
        return {"submission_id": submission.id, "evaluation_id": evaluation.id, "status": "SUCCESS"}
    except Exception as exc:
        failure_reason = str(exc)
        try:
            submission = Submission.objects.select_related("question", "subject").get(pk=submission_id)
            submission.processing_error = failure_reason[:5000]
            submission.save(update_fields=["processing_error"])
            if submission.status != Submission.Status.FAILED:
                transition_submission(submission, Submission.Status.FAILED)
        except Exception:
            # Keep the task result actionable even if its row disappeared or
            # the status update itself failed; the stuck-job monitor is a
            # second recovery path for a row left in PROCESSING.
            pass
        return {"submission_id": submission_id, "status": "FAILED", "error": failure_reason}


@shared_task
def fail_stuck_submissions(timeout_seconds=None):
    """Fail processing jobs that exceeded the configured timeout."""
    from django.conf import settings
    from submissions.state import transition_submission
    from submissions.models import Submission

    timeout = int(timeout_seconds or settings.SUBMISSION_STUCK_TIMEOUT_SECONDS)
    cutoff = timezone.now() - timedelta(seconds=timeout)
    stuck = Submission.objects.filter(
        Q(status=Submission.Status.PROCESSING, processing_started_at__lt=cutoff)
        | Q(status=Submission.Status.UPLOADED, submitted_at__lt=cutoff)
    )
    failed_ids = []
    for submission in stuck.iterator():
        if submission.status == Submission.Status.UPLOADED:
            reason = "Queued evaluation did not start"
        else:
            reason = "Evaluation exceeded its processing timeout"
        submission.processing_error = f"{reason} after {timeout} seconds. Retry this attempt."
        submission.save(update_fields=["processing_error"])
        transition_submission(submission, Submission.Status.FAILED)
        failed_ids.append(submission.id)
    return {"failed_submission_ids": failed_ids, "count": len(failed_ids)}
