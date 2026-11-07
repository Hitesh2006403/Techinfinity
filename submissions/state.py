"""Single source of truth for submission and evaluation lifecycle changes."""

from django.db import transaction
from django.utils import timezone

from .models import Submission


class InvalidStatusTransition(ValueError):
    pass


ALLOWED_TRANSITIONS = {
    Submission.Status.UPLOADED: {Submission.Status.PROCESSING, Submission.Status.FAILED},
    Submission.Status.PROCESSING: {
        Submission.Status.AI_EVALUATED,
        Submission.Status.FAILED,
    },
    Submission.Status.AI_EVALUATED: {
        Submission.Status.PENDING_TEACHER_REVIEW,
        Submission.Status.FAILED,
    },
    Submission.Status.PENDING_TEACHER_REVIEW: {
        Submission.Status.APPROVED,
        Submission.Status.FAILED,
    },
    Submission.Status.APPROVED: {Submission.Status.PUBLISHED},
    Submission.Status.PUBLISHED: set(),
    Submission.Status.FAILED: {Submission.Status.PROCESSING, Submission.Status.UPLOADED},
}

LEGACY_STATUS_MAP = {
    Submission.Status.SUBMITTED: Submission.Status.UPLOADED,
    Submission.Status.EVALUATED: Submission.Status.PENDING_TEACHER_REVIEW,
    Submission.Status.REVIEWED: Submission.Status.PENDING_TEACHER_REVIEW,
}


@transaction.atomic
def transition_submission(submission, target, *, evaluation=None, actor=None):
    """Atomically move a submission and its evaluation through allowed states.

    The legacy labels are normalized so old rows and compatibility endpoints can
    enter the new lifecycle without discarding existing submissions.
    """
    target = str(target)
    current = LEGACY_STATUS_MAP.get(submission.status, submission.status)
    if current == target:
        return submission
    if target not in Submission.Status.values:
        raise InvalidStatusTransition(f"Unknown submission status: {target}.")
    if target not in ALLOWED_TRANSITIONS.get(current, set()):
        raise InvalidStatusTransition(
            f"Cannot move a submission from {current} to {target}."
        )

    if evaluation is None:
        evaluation = getattr(submission, "evaluation", None)
    if target in {Submission.Status.APPROVED, Submission.Status.PUBLISHED}:
        if evaluation is None:
            raise InvalidStatusTransition("An evaluation is required before approval or publication.")
        if not evaluation.question_evaluations.exists():
            raise InvalidStatusTransition("An evaluation with question-level results is required.")
    if target == Submission.Status.PUBLISHED:
        if current != Submission.Status.APPROVED:
            raise InvalidStatusTransition("Approve the evaluation before publishing it.")
        if evaluation.teacher_approved_marks is None:
            raise InvalidStatusTransition("Final teacher-approved marks are required before publication.")

    now = timezone.now()
    submission.status = target
    submission_fields = ["status"]
    if target == Submission.Status.PROCESSING:
        submission.processing_started_at = now
        submission_fields.append("processing_started_at")
    submission.save(update_fields=submission_fields)

    if evaluation is not None:
        evaluation.status = target
        evaluation_fields = ["status"]
        if target in {
            Submission.Status.UPLOADED,
            Submission.Status.PROCESSING,
            Submission.Status.AI_EVALUATED,
            Submission.Status.PENDING_TEACHER_REVIEW,
            Submission.Status.FAILED,
        }:
            if target != Submission.Status.FAILED:
                evaluation.teacher_review_status = evaluation.ReviewStatus.PENDING
                evaluation_fields.append("teacher_review_status")
        if target == Submission.Status.APPROVED:
            evaluation.teacher_review_status = evaluation.ReviewStatus.APPROVED
            evaluation.approved_at = now
            evaluation.approved_by = actor
            evaluation_fields.extend(["teacher_review_status", "approved_at", "approved_by"])
        elif target == Submission.Status.PUBLISHED:
            evaluation.teacher_review_status = evaluation.ReviewStatus.APPROVED
            evaluation.published_at = now
            evaluation.published_by = actor
            evaluation_fields.extend(["teacher_review_status", "published_at", "published_by"])
        evaluation.save(update_fields=evaluation_fields)
    return submission
