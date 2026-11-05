from rest_framework import permissions


class IsStudentToSubmit(permissions.BasePermission):
    """
    Ensures only users with role STUDENT can create submissions.
    """

    message = "Only students are authorized to submit answers."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method == "POST":
            return getattr(request.user, "role", None) == "STUDENT"
        return True


class CanAccessSubmission(permissions.BasePermission):
    """
    Object-level permission:
    - Student who submitted can view.
    - Teacher who owns the question can view.
    - Staff or superuser can view.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        if obj.student == user:
            return True

        if obj.question.teacher == user:
            return True

        return False
