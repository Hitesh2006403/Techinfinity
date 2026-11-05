from rest_framework.response import Response
from rest_framework import status


def api_response(
    success: bool = True,
    message: str = "",
    data=None,
    errors=None,
    status_code: int = status.HTTP_200_OK,
) -> Response:
    """
    Standard EvalAI API response format:
    Success:
    {
        "success": true,
        "message": "...",
        "data": { ... }
    }
    Error:
    {
        "success": false,
        "message": "...",
        "errors": { ... }
    }
    """
    payload = {
        "success": success,
        "message": message,
    }
    if success:
        payload["data"] = data if data is not None else {}
    else:
        payload["errors"] = errors if errors is not None else {}

    return Response(payload, status=status_code)
