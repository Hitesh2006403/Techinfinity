from rest_framework import permissions


class IsTeacher(permissions.BasePermission):
    """
    Allows access only to authenticated users with the TEACHER role.
    """

    message = "Only teachers are authorized to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "TEACHER"
        )


class IsStudent(permissions.BasePermission):
    """
    Allows access only to authenticated users with the STUDENT role.
    """

    message = "Only students are authorized to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "STUDENT"
        )


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to Django staff or superusers.
    """

    message = "Staff or administrator credentials are required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class IsTeacherOrAdmin(permissions.BasePermission):
    """Allows teachers and Django staff/superusers, never regular students."""

    message = "Teacher or administrator credentials are required."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                getattr(user, "role", None) == "TEACHER"
                or user.is_staff
                or user.is_superuser
            )
        )


# Backwards-compatible name for existing internal imports.
IsStaffOrAdmin = IsAdminUser
