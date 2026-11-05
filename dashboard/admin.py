from django.contrib.auth import get_user_model
from questions.models import Question
from submissions.models import Submission
from evaluations.models import Evaluation

User = get_user_model()


def dashboard_callback(request, context: dict) -> dict:
    """
    Computes real-time dynamic statistics and recent activity
    for the Django Unfold Administrative Dashboard.
    Gracefully handles empty database state by yielding 0 counts.
    """
    # User counts
    total_users = User.objects.count()
    total_teachers = User.objects.filter(role=User.Role.TEACHER).count()
    total_students = User.objects.filter(role=User.Role.STUDENT).count()
    active_users = User.objects.filter(is_active=True).count()
    inactive_users = User.objects.filter(is_active=False).count()

    # Academic & Submission counts
    total_questions = Question.objects.count()
    total_submissions = Submission.objects.count()
    pending_evaluations = Submission.objects.filter(
        status=Submission.Status.SUBMITTED
    ).count()
    completed_evaluations = Evaluation.objects.count()

    # Evaluation Review statuses
    pending_teacher_reviews = Evaluation.objects.filter(
        teacher_review_status=Evaluation.ReviewStatus.PENDING
    ).count()
    approved_evaluations = Evaluation.objects.filter(
        teacher_review_status=Evaluation.ReviewStatus.APPROVED
    ).count()
    modified_evaluations = Evaluation.objects.filter(
        teacher_review_status=Evaluation.ReviewStatus.MODIFIED
    ).count()

    # Recent activity queries
    recent_submissions = (
        Submission.objects.select_related("student", "question")
        .order_by("-submitted_at")[:5]
    )
    recently_evaluated = (
        Evaluation.objects.select_related("submission__student", "submission__question")
        .order_by("-evaluated_at")[:5]
    )
    recent_questions = (
        Question.objects.select_related("teacher")
        .order_by("-created_at")[:5]
    )
    evaluations_awaiting_approval = (
        Evaluation.objects.filter(teacher_review_status=Evaluation.ReviewStatus.PENDING)
        .select_related("submission__student", "submission__question")
        .order_by("-evaluated_at")[:5]
    )

    context.update(
        {
            "kpi": {
                "total_users": total_users,
                "total_teachers": total_teachers,
                "total_students": total_students,
                "active_users": active_users,
                "inactive_users": inactive_users,
                "total_questions": total_questions,
                "total_submissions": total_submissions,
                "pending_evaluations": pending_evaluations,
                "completed_evaluations": completed_evaluations,
                "pending_teacher_reviews": pending_teacher_reviews,
                "approved_evaluations": approved_evaluations,
                "modified_evaluations": modified_evaluations,
            },
            "recent_submissions": recent_submissions,
            "recently_evaluated": recently_evaluated,
            "recent_questions": recent_questions,
            "evaluations_awaiting_approval": evaluations_awaiting_approval,
        }
    )

    return context
