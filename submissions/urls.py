from django.urls import path
from .views import (
    SubmissionListCreateView,
    SubmissionDetailView,
    TeacherAnswerSheetUploadView,
    RawAnswerSheetUploadView,
    MappedAnswerSheetUploadView,
    SubjectDocumentListView,
)
from evaluations.views import EvaluateSubmissionView, SubmissionEvaluationDetailView

app_name = "submissions"

urlpatterns = [
    path("answer-sheets/subject/<int:subject_id>/", SubjectDocumentListView.as_view(), name="subject-document-list"),
    path("answer-sheets/mapped-upload/", MappedAnswerSheetUploadView.as_view(), name="mapped-answer-sheet-upload"),
    path("answer-sheets/upload/", RawAnswerSheetUploadView.as_view(), name="raw-answer-sheet-upload"),
    path("answer-sheets/", TeacherAnswerSheetUploadView.as_view(), name="answer-sheet-upload"),
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
