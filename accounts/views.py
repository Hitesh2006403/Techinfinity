from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.authtoken.models import Token
from config.responses import api_response
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
)
from .models import User


class RegisterView(APIView):
    """
    Base view for role-specific public registration endpoints.
    """

    permission_classes = [permissions.AllowAny]
    # Registration is public. Do not let an existing Django admin session
    # trigger SessionAuthentication's CSRF check on this API endpoint.
    authentication_classes = []
    role = None

    def post(self, request):
        serializer = UserRegistrationSerializer(
            data=request.data, context={"role": self.role}
        )
        if serializer.is_valid():
            user = serializer.save()
            token = Token.objects.get(user=user)
            user_data = UserSerializer(user).data
            return api_response(
                success=True,
                message=f"User registered successfully as {user.get_role_display()}.",
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


class TeacherRegistrationView(RegisterView):
    """POST /api/auth/register/teacher/ creates a non-staff teacher."""

    role = User.Role.TEACHER


class StudentRegistrationView(RegisterView):
    """POST /api/auth/register/student/ creates a non-staff student."""

    role = User.Role.STUDENT


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates a user via email and password, returning their token and profile.
    """

    permission_classes = [permissions.AllowAny]
    # Login must also work independently of any existing admin session.
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            token = serializer.validated_data["token"]
            user_data = UserSerializer(user).data
            return api_response(
                success=True,
                message="Login successful",
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
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """POST /api/auth/logout/ invalidates the token used by the user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return api_response(
            success=True,
            message="Logout successful.",
            data=None,
            status_code=status.HTTP_200_OK,
        )


class TeacherStudentListView(APIView):
    """List students available to a teacher when uploading answer sheets."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != User.Role.TEACHER:
            return api_response(
                success=False,
                message="Only teachers can view the student list.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        students = User.objects.filter(role=User.Role.STUDENT, is_active=True).values(
            "id", "username", "first_name", "last_name", "email"
        )
        return api_response(
            success=True,
            message="Students retrieved successfully.",
            data={"students": list(students)},
        )
