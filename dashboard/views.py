from decimal import Decimal
from django.db.models import Avg, Count, Q
from rest_framework import permissions, status
from rest_framework.views import APIView
from config.responses import api_response
from questions.models import Question
from submissions.models import Submission
from evaluations.models import Evaluation
from accounts.permissions import IsTeacher, IsStudent


class TeacherDashboardView(APIView):
    """
    GET /api/dashboard/teacher/
    Returns real-time analytics for the authenticated teacher:
    - Questions created
    - Submissions received
    - Evaluations completed, pending, approved, modified
    - Recent submissions awaiting review
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request):
        teacher = request.user

        # Teacher's questions
        teacher_questions = Question.objects.filter(teacher=teacher)
        total_questions = teacher_questions.count()
        active_questions = teacher_questions.filter(is_active=True).count()

        # Submissions for teacher's questions
        teacher_submissions = Submission.objects.filter(
            question__teacher=teacher
        ).select_related("student", "question")
        total_submissions = teacher_submissions.count()
        pending_evaluations = teacher_submissions.filter(
            status=Submission.Status.SUBMITTED
        ).count()
        evaluated_submissions = teacher_submissions.filter(
            status=Submission.Status.EVALUATED
        ).count()
        reviewed_submissions = teacher_submissions.filter(
            status=Submission.Status.REVIEWED
        ).count()

        # Evaluations for teacher's questions
        teacher_evaluations = Evaluation.objects.filter(
            submission__question__teacher=teacher
        ).select_related("submission__student", "submission__question")
        total_evaluations = teacher_evaluations.count()
        pending_reviews = teacher_evaluations.filter(
            teacher_review_status=Evaluation.ReviewStatus.PENDING
        ).count()
        approved_evaluations = teacher_evaluations.filter(
            teacher_review_status=Evaluation.ReviewStatus.APPROVED
        ).count()
        modified_evaluations = teacher_evaluations.filter(
            teacher_review_status=Evaluation.ReviewStatus.MODIFIED
        ).count()

        # Recent submissions list (up to 5)
        recent_submissions_data = [
            {
                "id": sub.id,
                "question_id": sub.question.id,
                "question_title": sub.question.title,
                "student_username": sub.student.username,
                "student_name": sub.student.get_full_name() or sub.student.username,
                "status": sub.status,
                "submitted_at": sub.submitted_at,
            }
            for sub in teacher_submissions.order_by("-submitted_at")[:5]
        ]

        # Evaluations awaiting teacher review (up to 5)
        pending_review_list_data = [
            {
                "id": ev.id,
                "submission_id": ev.submission.id,
                "question_title": ev.submission.question.title,
                "student_username": ev.submission.student.username,
                "suggested_marks": ev.suggested_marks,
                "max_marks": ev.max_marks,
                "confidence": ev.confidence,
                "evaluated_at": ev.evaluated_at,
            }
            for ev in teacher_evaluations.filter(
                teacher_review_status=Evaluation.ReviewStatus.PENDING
            ).order_by("-evaluated_at")[:5]
        ]

        return api_response(
            success=True,
            message="Teacher dashboard metrics retrieved successfully.",
            data={
                "metrics": {
                    "total_questions": total_questions,
                    "active_questions": active_questions,
                    "total_submissions": total_submissions,
                    "pending_evaluations": pending_evaluations,
                    "evaluated_submissions": evaluated_submissions,
                    "reviewed_submissions": reviewed_submissions,
                    "total_evaluations": total_evaluations,
                    "pending_reviews": pending_reviews,
                    "approved_evaluations": approved_evaluations,
                    "modified_evaluations": modified_evaluations,
                },
                "recent_submissions": recent_submissions_data,
                "pending_reviews_list": pending_review_list_data,
            },
            status_code=status.HTTP_200_OK,
        )


class StudentDashboardView(APIView):
    """
    GET /api/dashboard/student/
    Returns real-time analytics for the authenticated student:
    - Total submissions made
    - Evaluated & Reviewed counts
    - Average score percentage
    - Recent submissions and feedback
    """

    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        student = request.user

        student_submissions = (
            Submission.objects.filter(student=student)
            .select_related("question", "question__teacher")
            .prefetch_related("evaluation")
        )
        total_submissions = student_submissions.count()
        submitted_count = student_submissions.filter(
            status=Submission.Status.SUBMITTED
        ).count()
        evaluated_count = student_submissions.filter(
            status=Submission.Status.EVALUATED
        ).count()
        reviewed_count = student_submissions.filter(
            status=Submission.Status.REVIEWED
        ).count()

        # Score calculations
        student_evaluations = Evaluation.objects.filter(submission__student=student)
        score_percentages = []
        for ev in student_evaluations:
            final_mark = (
                ev.teacher_approved_marks
                if ev.teacher_approved_marks is not None
                else ev.suggested_marks
            )
            if ev.max_marks > 0:
                pct = (float(final_mark) / float(ev.max_marks)) * 100.0
                score_percentages.append(pct)

        average_score_percentage = (
            round(sum(score_percentages) / len(score_percentages), 2)
            if score_percentages
            else 0.0
        )

        recent_submissions_data = []
        for sub in student_submissions.order_by("-submitted_at")[:5]:
            eval_data = None
            if (
                hasattr(sub, "evaluation")
                and sub.evaluation is not None
                and sub.evaluation.teacher_review_status != Evaluation.ReviewStatus.PENDING
            ):
                ev = sub.evaluation
                eval_data = {
                    "evaluation_id": ev.id,
                    "suggested_marks": ev.suggested_marks,
                    "teacher_approved_marks": ev.teacher_approved_marks,
                    "max_marks": ev.max_marks,
                    "final_marks": ev.final_marks,
                    "teacher_review_status": ev.teacher_review_status,
                    "feedback": ev.feedback,
                }

            recent_submissions_data.append(
                {
                    "submission_id": sub.id,
                    "question_id": sub.question.id,
                    "question_title": sub.question.title,
                    "subject": sub.question.subject,
                    "submitted_at": sub.submitted_at,
                    "status": sub.status,
                    "evaluation": eval_data,
                }
            )

        return api_response(
            success=True,
            message="Student dashboard metrics retrieved successfully.",
            data={
                "metrics": {
                    "total_submissions": total_submissions,
                    "submitted_count": submitted_count,
                    "evaluated_count": evaluated_count,
                    "reviewed_count": reviewed_count,
                    "average_score_percentage": average_score_percentage,
                },
                "recent_submissions": recent_submissions_data,
            },
            status_code=status.HTTP_200_OK,
        )


class TeacherAnalyticsView(APIView):
    """Return aggregate, teacher-owned evaluation analytics without exposing student answers."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request):
        evaluations = Evaluation.objects.filter(
            submission__question__teacher=request.user
        ).select_related("submission__question")
        scored = []
        for evaluation in evaluations:
            mark = evaluation.teacher_approved_marks
            if mark is None:
                mark = evaluation.suggested_marks
            percentage = (float(mark) / float(evaluation.max_marks) * 100) if evaluation.max_marks else 0
            scored.append((float(mark), float(evaluation.max_marks), percentage))

        bands = [("0–49%", 0, 50), ("50–69%", 50, 70), ("70–84%", 70, 85), ("85–100%", 85, 101)]
        distribution = [
            {
                "band": label,
                "count": sum(lower <= score < upper for _, _, score in scored),
            }
            for label, lower, upper in bands
        ]
        total = len(scored)
        for item in distribution:
            item["percentage"] = round((item["count"] / total) * 100, 2) if total else 0

        average_percentage = round(sum(score for _, _, score in scored) / total, 2) if total else 0
        return api_response(
            success=True,
            message="Teacher analytics retrieved successfully.",
            data={
                "total_evaluations": total,
                "average_score_percentage": average_percentage,
                "distribution": distribution,
            },
            status_code=status.HTTP_200_OK,
        )
