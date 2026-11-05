from django.urls import path
from .views import QuestionListCreateView, QuestionDetailView, SubjectResourceListCreateView

app_name = "questions"

urlpatterns = [
    path("subjects/", SubjectResourceListCreateView.as_view(), name="subject-resource-list-create"),
    path("", QuestionListCreateView.as_view(), name="question-list-create"),
    path("<int:pk>/", QuestionDetailView.as_view(), name="question-detail"),
]
