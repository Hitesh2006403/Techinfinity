from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from config.responses import api_response
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Registers a new student or teacher account and returns an auth token.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = Token.objects.get(user=user)
            user_data = UserSerializer(user).data
            return api_response(
                success=True,
                message=f"User registered successfully as {user.role.capitalize()}.",
                data={
                    "user": user_data,
                    "token": token.key,
                },
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Registration failed. Please check the provided details.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates a user via username/email and password, returning their token and profile.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            token = serializer.validated_data["token"]
            user_data = UserSerializer(user).data
            return api_response(
                success=True,
                message="Login successful.",
                data={
                    "user": user_data,
                    "token": token,
                },
                status_code=status.HTTP_200_OK,
            )
        return api_response(
            success=False,
            message="Authentication failed.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Retrieves the authenticated user's profile and role.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return api_response(
            success=True,
            message="User profile retrieved successfully.",
            data={"user": serializer.data},
            status_code=status.HTTP_200_OK,
        )
