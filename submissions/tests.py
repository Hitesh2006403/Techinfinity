from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from questions.models import Question
from submissions.models import Submission

User = get_user_model()


class SubmissionAPITests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher_sub",
            email="teacher_sub@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.student1 = User.objects.create_user(
            username="student_sub1",
            email="student_sub1@evalai.com",
            password="Password123!",
            role="STUDENT",
        )
        self.student2 = User.objects.create_user(
            username="student_sub2",
            email="student_sub2@evalai.com",
            password="Password123!",
            role="STUDENT",
        )

        self.question = Question.objects.create(
            teacher=self.teacher,
            subject="Operating Systems",
            title="Explain Virtual Memory",
            question_text="Explain virtual memory paging and page faults.",
            reference_answer="Virtual memory abstracts physical RAM using pages, page tables, and MMU.",
            max_marks=Decimal("10.00"),
            is_active=True,
        )

        self.submission1 = Submission.objects.create(
            question=self.question,
            student=self.student1,
            answer_text="Virtual memory allows executing processes that require more memory than physical RAM by paging.",
            status=Submission.Status.SUBMITTED,
        )

        self.list_create_url = reverse("submissions:submission-list-create")
        self.detail_url = reverse(
            "submissions:submission-detail", kwargs={"pk": self.submission1.pk}
        )

    def test_student_can_create_submission(self):
        """Test student successfully submits answer."""
        self.client.force_authenticate(user=self.student2)
        data = {
            "question_id": self.question.id,
            "answer_text": "Paging is a memory management scheme that eliminates the need for contiguous allocation.",
        }
        response = self.client.post(self.list_create_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(
            response.data["data"]["submission"]["student_username"], "student_sub2"
        )
        self.assertEqual(
            response.data["data"]["submission"]["status"], "SUBMITTED"
        )

    def test_teacher_cannot_create_submission(self):
        """Test teacher cannot submit answer."""
        self.client.force_authenticate(user=self.teacher)
        data = {
            "question_id": self.question.id,
            "answer_text": "A teacher should not submit an answer to their own question.",
        }
        response = self.client.post(self.list_create_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_answer_validation(self):
        """Test that submitting empty answer fails validation."""
        self.client.force_authenticate(user=self.student2)
        data = {
            "question_id": self.question.id,
            "answer_text": "   ",
        }
        response = self.client.post(self.list_create_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_student_cannot_view_other_student_submission(self):
        """Test that student2 cannot access student1's submission."""
        self.client.force_authenticate(user=self.student2)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_question_teacher_can_view_student_submission(self):
        """Test that the question's teacher can view student's submission."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["data"]["submission"]["id"], self.submission1.id
        )
