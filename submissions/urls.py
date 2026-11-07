from django.urls import path
from .views import (
    SubmissionListCreateView,
    SubmissionDetailView,
    TeacherAnswerSheetUploadView,
    RawAnswerSheetUploadView,
    MappedAnswerSheetUploadView,
    EadaesMappedAnswerSheetUploadView,
    SubjectDocumentListView,
    AnswerSheetDownloadView,
    AnswerSheetPreviewView,
    UnifiedAnswerSheetUploadView,
    RetrySubmissionView,
)
from evaluations.views import EvaluateSubmissionView, SubmissionEvaluationDetailView

app_name = "submissions"

urlpatterns = [
    path("answer-sheets/subject/<int:subject_id>/", SubjectDocumentListView.as_view(), name="subject-document-list"),
    path("subjects/<int:subject_id>/answer-sheets/", UnifiedAnswerSheetUploadView.as_view(), name="subject-answer-sheet-upload"),
    path("<int:submission_id>/retry/", RetrySubmissionView.as_view(), name="submission-retry"),
    # Legacy upload paths remain for existing API clients; the active UI uses
    # the subject-scoped endpoint above.
    path("answer-sheets/mapped-upload/", MappedAnswerSheetUploadView.as_view(), name="mapped-answer-sheet-upload"),
    path("answer-sheets/eadaes-upload/", EadaesMappedAnswerSheetUploadView.as_view(), name="eadaes-mapped-answer-sheet-upload"),
    path("answer-sheets/upload/", RawAnswerSheetUploadView.as_view(), name="raw-answer-sheet-upload"),
    path("answer-sheets/", TeacherAnswerSheetUploadView.as_view(), name="answer-sheet-upload"),
    path("<int:submission_id>/answer-sheet/download/", AnswerSheetDownloadView.as_view(), name="submission-answer-sheet-download"),
    path("<int:submission_id>/answer-sheet/preview/", AnswerSheetPreviewView.as_view(), name="submission-answer-sheet-preview"),
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
