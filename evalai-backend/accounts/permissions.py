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


class IsStaffOrAdmin(permissions.BasePermission):
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
