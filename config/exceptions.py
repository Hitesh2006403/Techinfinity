import logging
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Centralized exception handler to normalize all API error responses
    into the standard format:
    {
        "success": false,
        "message": "...",
        "errors": { ... }
    }
    """
    # Call REST framework's default exception handler first to get standard response
    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred while processing the request."
        errors = {}

        if isinstance(exc, exceptions.ValidationError):
            message = "Validation failed. Please verify the submitted data."
            errors = response.data
        elif isinstance(exc, exceptions.NotAuthenticated):
            message = "Authentication credentials were not provided."
            errors = {"detail": str(exc.detail)}
        elif isinstance(exc, exceptions.AuthenticationFailed):
            message = "Authentication failed. Invalid credentials or expired token."
            errors = {"detail": str(exc.detail)}
        elif isinstance(exc, exceptions.PermissionDenied):
            message = "You do not have permission to perform this action."
            errors = {"detail": str(exc.detail)}
        elif isinstance(exc, exceptions.NotFound) or isinstance(exc, Http404):
            message = "Requested resource was not found."
            errors = {"detail": getattr(exc, "detail", str(exc))}
        elif isinstance(exc, exceptions.MethodNotAllowed):
            message = f"Method '{context.get('request').method if context.get('request') else 'UNKNOWN'}' not allowed."
            errors = {"detail": getattr(exc, "detail", str(exc))}
        else:
            if isinstance(response.data, dict):
                errors = response.data
                if "detail" in response.data:
                    message = str(response.data["detail"])
            else:
                errors = {"detail": response.data}

        response.data = {
            "success": False,
            "message": message,
            "errors": errors,
        }
        return response

    # Handle Django-native validation error if raised inside views
    if isinstance(exc, DjangoValidationError):
        return Response(
            {
                "success": False,
                "message": "Validation error.",
                "errors": exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Handle unhandled server exceptions (500)
    logger.exception("Unhandled server exception: %s", exc)
    return Response(
        {
            "success": False,
            "message": "An internal server error occurred. Please contact the administrator.",
            "errors": {},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
