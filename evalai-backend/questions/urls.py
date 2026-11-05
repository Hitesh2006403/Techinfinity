from django.urls import path
from .views import QuestionListCreateView, QuestionDetailView

app_name = "questions"

urlpatterns = [
    path("", QuestionListCreateView.as_view(), name="question-list-create"),
    path("<int:pk>/", QuestionDetailView.as_view(), name="question-detail"),
]
