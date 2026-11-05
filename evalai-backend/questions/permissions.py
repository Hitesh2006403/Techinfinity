from rest_framework import permissions


class IsTeacherOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow the owner (teacher) of a question
    to edit or delete it. Read-only permissions are allowed to authenticated users.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        # Only users with role TEACHER can create questions
        return getattr(request.user, "role", None) == "TEACHER"

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the teacher who created the question
        return obj.teacher == request.user or request.user.is_superuser
