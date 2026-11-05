from django.urls import path
from .views import (
    EvaluationDetailView,
    TeacherApproveEvaluationView,
    TeacherUpdateMarksView,
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
        "<int:pk>/update-marks/",
        TeacherUpdateMarksView.as_view(),
        name="evaluation-update-marks",
    ),
]
