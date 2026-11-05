from rest_framework import permissions


class CanEvaluateSubmission(permissions.BasePermission):
    """
    Checks if user is authorized to trigger evaluation:
    - Teacher who owns the question
    - Staff / superuser
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        if obj.question.teacher == user:
            return True

        return False


class CanViewEvaluation(permissions.BasePermission):
    """
    Checks if user is authorized to view an evaluation:
    - Student who submitted the answer
    - Teacher who created the question
    - Staff / superuser
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        if obj.submission.student == user:
            return True

        if obj.submission.question.teacher == user:
            return True

        return False


class IsTeacherOwnerForReview(permissions.BasePermission):
    """
    Only the teacher who created the question can approve or modify marks.
    """

    message = "Only the teacher who owns this question can approve or modify its evaluation marks."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        return (
            getattr(user, "role", None) == "TEACHER"
            and obj.submission.question.teacher == user
        )
