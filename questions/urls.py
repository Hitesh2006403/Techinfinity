from django.urls import path
from .views import (
    QuestionListCreateView,
    QuestionDetailView,
    SubjectResourceListCreateView,
    EadaesSubjectCreateView,
    SubjectPipelineView,
    EadaesDocumentUploadView,
    ExamListCreateView,
    ExamDetailView,
    QuestionRubricView,
    ExtractedQuestionUpdateView,
    ReferenceDocumentRetryView,
    QuestionPaperRetryView,
    SubjectEnrollmentView,
    QuestionPaperDownloadView,
    ReferenceDocumentDownloadView,
    SubjectDocumentReplaceView,
)

app_name = "questions"

urlpatterns = [
    path("subjects/", SubjectResourceListCreateView.as_view(), name="subject-resource-list-create"),
    path("subjects/eadaes/", EadaesSubjectCreateView.as_view(), name="eadaes-subject-create"),
    path("subjects/<int:subject_id>/pipeline/", SubjectPipelineView.as_view(), name="subject-pipeline"),
    path("subjects/<int:subject_id>/enrollments/", SubjectEnrollmentView.as_view(), name="subject-enrollments"),
    path("subjects/<int:subject_id>/enrollments/<int:student_id>/", SubjectEnrollmentView.as_view(), name="subject-enrollment-detail"),
    path("subjects/<int:subject_id>/question-paper/download/", QuestionPaperDownloadView.as_view(), name="subject-question-paper-download"),
    path("subjects/<int:subject_id>/reference-material/download/", ReferenceDocumentDownloadView.as_view(), name="subject-reference-download"),
    path("subjects/<int:subject_id>/replace-document/", SubjectDocumentReplaceView.as_view(), name="subject-document-replace"),
    path("subjects/<int:subject_id>/documents/", EadaesDocumentUploadView.as_view(), name="eadaes-document-upload"),
    path("exams/", ExamListCreateView.as_view(), name="exam-list-create"),
    path("exams/<int:pk>/", ExamDetailView.as_view(), name="exam-detail"),
    path("<int:question_id>/rubric/", QuestionRubricView.as_view(), name="question-rubric"),
    path("extracted-questions/<int:pk>/", ExtractedQuestionUpdateView.as_view(), name="extracted-question-update"),
    path("reference-documents/<int:pk>/retry/", ReferenceDocumentRetryView.as_view(), name="reference-document-retry"),
    path("question-papers/<int:pk>/retry/", QuestionPaperRetryView.as_view(), name="question-paper-retry"),
    path("", QuestionListCreateView.as_view(), name="question-list-create"),
    path("<int:pk>/", QuestionDetailView.as_view(), name="question-detail"),
]
