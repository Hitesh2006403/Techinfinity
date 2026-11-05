from django.urls import path
from .views import (
    LoginView,
    CurrentUserView,
    LogoutView,
    StudentRegistrationView,
    TeacherRegistrationView,
    TeacherStudentListView,
)

app_name = "accounts"

urlpatterns = [
    path("register/teacher/", TeacherRegistrationView.as_view(), name="register-teacher"),
    path("register/student/", StudentRegistrationView.as_view(), name="register-student"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("students/", TeacherStudentListView.as_view(), name="teacher-students"),
]
