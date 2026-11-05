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
        user = request.user

        if user.is_staff or user.is_superuser:
            return True

        # Students can see active questions available for submission. A teacher
        # can only read or change questions they created; reference answers and
        # rubrics must remain private from other teachers.
        if request.method in permissions.SAFE_METHODS:
            if getattr(user, "role", None) == "STUDENT":
                return obj.is_active
            return getattr(user, "role", None) == "TEACHER" and obj.teacher == user

        # Write permissions are only allowed to the teacher who created the question
        return getattr(user, "role", None) == "TEACHER" and obj.teacher == user
