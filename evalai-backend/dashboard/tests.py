from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from questions.models import Question
from submissions.models import Submission
from evaluations.models import Evaluation

User = get_user_model()


class DashboardAPITests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher_dash",
            email="teacher_dash@evalai.com",
            password="Password123!",
            role="TEACHER",
            is_staff=False,
        )
        self.student = User.objects.create_user(
            username="student_dash",
            email="student_dash@evalai.com",
            password="Password123!",
            role="STUDENT",
            is_staff=False,
        )

        self.question = Question.objects.create(
            teacher=self.teacher,
            subject="Security",
            title="Explain Public Key Cryptography",
            question_text="Explain asymmetric encryption and key pairs.",
            reference_answer="Public key encrypts, private key decrypts.",
            max_marks=Decimal("10.00"),
            is_active=True,
        )

        self.submission = Submission.objects.create(
            question=self.question,
            student=self.student,
            answer_text="Asymmetric cryptography uses mathematical key pairs.",
            status=Submission.Status.EVALUATED,
        )

        self.evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("8.00"),
            max_marks=Decimal("10.00"),
            feedback="Good summary.",
            confidence=0.9,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )

        self.teacher_dash_url = reverse("dashboard:teacher-dashboard")
        self.student_dash_url = reverse("dashboard:student-dashboard")

    def test_teacher_dashboard_metrics(self):
        """Test teacher dashboard returns aggregated real metrics."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.teacher_dash_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        metrics = response.data["data"]["metrics"]
        self.assertEqual(metrics["total_questions"], 1)
        self.assertEqual(metrics["total_submissions"], 1)
        self.assertEqual(metrics["pending_reviews"], 1)

    def test_student_dashboard_metrics(self):
        """Test student dashboard returns aggregated real metrics."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.student_dash_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        metrics = response.data["data"]["metrics"]
        self.assertEqual(metrics["total_submissions"], 1)
        self.assertEqual(metrics["evaluated_count"], 1)
        self.assertEqual(metrics["average_score_percentage"], 80.0)

    def test_student_forbidden_from_teacher_dashboard(self):
        """Test student receives 403 when requesting teacher dashboard."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.teacher_dash_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_forbidden_from_student_dashboard(self):
        """Test teacher receives 403 when requesting student dashboard."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.student_dash_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthorized_admin_access_rejected(self):
        """Test non-staff user cannot access Django admin."""
        self.client.force_authenticate(user=self.student)
        admin_response = self.client.get("/admin/")
        # Django redirects non-staff authenticated users or shows login
        self.assertIn(
            admin_response.status_code,
            [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN],
        )
