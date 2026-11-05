from django.urls import path
from .views import TeacherDashboardView, StudentDashboardView

app_name = "dashboard"

urlpatterns = [
    path("teacher/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("student/", StudentDashboardView.as_view(), name="student-dashboard"),
]
