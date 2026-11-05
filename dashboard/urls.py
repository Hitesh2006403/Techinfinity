from django.urls import path
from .views import TeacherDashboardView, StudentDashboardView, TeacherAnalyticsView

app_name = "dashboard"

urlpatterns = [
    path("teacher/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("teacher/analytics/", TeacherAnalyticsView.as_view(), name="teacher-analytics"),
    path("student/", StudentDashboardView.as_view(), name="student-dashboard"),
]
