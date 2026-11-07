from django.urls import path
from .views import (
    EvaluationDetailView,
    TeacherApproveEvaluationView,
    TeacherApproveAndPublishView,
    TeacherUpdateMarksView,
    TeacherPublishEvaluationView,
    EvaluationReportDownloadView,
)

app_name = "evaluations"

urlpatterns = [
    path("<int:pk>/", EvaluationDetailView.as_view(), name="evaluation-detail"),
    path(
        "<int:pk>/approve/",
        TeacherApproveEvaluationView.as_view(),
        name="evaluation-approve",
    ),
    path(
        "<int:pk>/approve-and-publish/",
        TeacherApproveAndPublishView.as_view(),
        name="evaluation-approve-and-publish",
    ),
    path(
        "<int:pk>/update-marks/",
        TeacherUpdateMarksView.as_view(),
        name="evaluation-update-marks",
    ),
    path("<int:pk>/publish/", TeacherPublishEvaluationView.as_view(), name="evaluation-publish"),
    path("<int:pk>/report/download/", EvaluationReportDownloadView.as_view(), name="evaluation-report-download"),
]
