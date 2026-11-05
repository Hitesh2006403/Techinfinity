from django.urls import path
from .views import SubmissionListCreateView, SubmissionDetailView
from evaluations.views import EvaluateSubmissionView, SubmissionEvaluationDetailView

app_name = "submissions"

urlpatterns = [
    path("", SubmissionListCreateView.as_view(), name="submission-list-create"),
    path("<int:pk>/", SubmissionDetailView.as_view(), name="submission-detail"),
    path(
        "<int:pk>/evaluate/",
        EvaluateSubmissionView.as_view(),
        name="submission-evaluate",
    ),
    path(
        "<int:submission_id>/evaluation/",
        SubmissionEvaluationDetailView.as_view(),
        name="submission-evaluation-detail",
    ),
]
