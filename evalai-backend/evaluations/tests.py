from decimal import Decimal
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from questions.models import Question
from submissions.models import Submission
from evaluations.models import Evaluation

User = get_user_model()


class EvaluationAPITests(APITestCase):
    def setUp(self):
        self.teacher1 = User.objects.create_user(
            username="teacher_eval1",
            email="teacher_eval1@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.teacher2 = User.objects.create_user(
            username="teacher_eval2",
            email="teacher_eval2@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.student1 = User.objects.create_user(
            username="student_eval1",
            email="student_eval1@evalai.com",
            password="Password123!",
            role="STUDENT",
        )
        self.student2 = User.objects.create_user(
            username="student_eval2",
            email="student_eval2@evalai.com",
            password="Password123!",
            role="STUDENT",
        )

        self.question = Question.objects.create(
            teacher=self.teacher1,
            subject="Networks",
            title="Explain TCP Handshake",
            question_text="Explain the three-way handshake in TCP.",
            reference_answer="SYN, SYN-ACK, ACK establishing sequence numbers.",
            max_marks=Decimal("10.00"),
            is_active=True,
        )

        self.submission = Submission.objects.create(
            question=self.question,
            student=self.student1,
            answer_text="TCP uses SYN from client, SYN-ACK from server, and ACK from client to establish connection.",
            status=Submission.Status.SUBMITTED,
        )

        self.evaluate_url = reverse(
            "submissions:submission-evaluate", kwargs={"pk": self.submission.pk}
        )

    @patch("evaluations.views.evaluate_submission")
    def test_mocked_ai_evaluation(self, mock_evaluate):
        """Test AI evaluation endpoint with mocked Gemini service."""
        def fake_evaluate(submission):
            eval_obj = Evaluation.objects.create(
                submission=submission,
                suggested_marks=Decimal("8.50"),
                max_marks=Decimal("10.00"),
                feedback="Great explanation of the 3-way handshake packets.",
                concepts_found=["SYN packet", "SYN-ACK response", "ACK handshake"],
                missing_concepts=["Did not mention initial sequence numbers (ISN)."],
                incorrect_concepts=[],
                criterion_wise_marks=[
                    {"criterion": "Steps", "marks_awarded": 5.0, "max_marks": 5.0, "reason": "Accurate sequence"},
                    {"criterion": "ISN and Reliability", "marks_awarded": 3.5, "max_marks": 5.0, "reason": "Missing ISN"},
                ],
                reasoning="Student accurately described all three phases.",
                confidence=0.95,
                teacher_review_status=Evaluation.ReviewStatus.PENDING,
            )
            submission.status = Submission.Status.EVALUATED
            submission.save()
            return eval_obj

        mock_evaluate.side_effect = fake_evaluate

        self.client.force_authenticate(user=self.teacher1)
        response = self.client.post(self.evaluate_url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        eval_data = response.data["data"]["evaluation"]
        self.assertEqual(Decimal(str(eval_data["suggested_marks"])), Decimal("8.50"))
        self.assertEqual(eval_data["teacher_review_status"], "PENDING")

    def test_duplicate_evaluation_returns_existing(self):
        """Test that evaluating an already evaluated submission does not re-run or duplicate."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("7.00"),
            max_marks=Decimal("10.00"),
            feedback="Already evaluated.",
            confidence=0.9,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )
        self.submission.status = Submission.Status.EVALUATED
        self.submission.save()

        self.client.force_authenticate(user=self.teacher1)
        response = self.client.post(self.evaluate_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["evaluation"]["id"], evaluation.id)

    def test_student_cannot_trigger_ai_evaluation(self):
        """Students submit answers but cannot spend evaluation service capacity."""
        self.client.force_authenticate(user=self.student1)
        response = self.client.post(self.evaluate_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_approves_evaluation(self):
        """Test teacher approving AI suggested marks."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("8.00"),
            max_marks=Decimal("10.00"),
            feedback="Initial feedback.",
            confidence=0.92,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )
        approve_url = reverse(
            "evaluations:evaluation-approve", kwargs={"pk": evaluation.pk}
        )

        self.client.force_authenticate(user=self.teacher1)
        response = self.client.post(
            approve_url, {"teacher_comments": "Verified and approved."}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        evaluation.refresh_from_db()
        self.assertEqual(evaluation.teacher_review_status, Evaluation.ReviewStatus.APPROVED)
        self.assertEqual(evaluation.teacher_approved_marks, Decimal("8.00"))
        self.assertEqual(evaluation.submission.status, Submission.Status.REVIEWED)

    def test_teacher_modifies_marks(self):
        """Test teacher overriding AI marks with custom score and preserving suggested marks."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("6.50"),
            max_marks=Decimal("10.00"),
            feedback="Initial feedback.",
            confidence=0.88,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )
        update_url = reverse(
            "evaluations:evaluation-update-marks", kwargs={"pk": evaluation.pk}
        )

        self.client.force_authenticate(user=self.teacher1)
        response = self.client.post(
            update_url,
            {"approved_marks": "8.50", "teacher_comments": "Adjusted for good diagram."},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        evaluation.refresh_from_db()
        self.assertEqual(evaluation.teacher_review_status, Evaluation.ReviewStatus.MODIFIED)
        self.assertEqual(evaluation.teacher_approved_marks, Decimal("8.50"))
        # Verify original AI mark is preserved!
        self.assertEqual(evaluation.suggested_marks, Decimal("6.50"))

    def test_modified_marks_exceeding_max_marks_rejected(self):
        """Test marks validation rejects score exceeding max marks."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("6.50"),
            max_marks=Decimal("10.00"),
            feedback="Feedback.",
            confidence=0.9,
        )
        update_url = reverse(
            "evaluations:evaluation-update-marks", kwargs={"pk": evaluation.pk}
        )

        self.client.force_authenticate(user=self.teacher1)
        response = self.client.post(
            update_url,
            {"approved_marks": "15.00"},  # Max is 10.00!
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_another_teacher_cannot_review_evaluation(self):
        """Test that a teacher who does not own the question cannot review evaluation."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("7.00"),
            max_marks=Decimal("10.00"),
            feedback="Feedback.",
            confidence=0.9,
        )
        approve_url = reverse(
            "evaluations:evaluation-approve", kwargs={"pk": evaluation.pk}
        )

        self.client.force_authenticate(user=self.teacher2)
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_review_evaluation(self):
        """Test that student cannot review or approve marks."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("7.00"),
            max_marks=Decimal("10.00"),
            feedback="Feedback.",
            confidence=0.9,
        )
        approve_url = reverse(
            "evaluations:evaluation-approve", kwargs={"pk": evaluation.pk}
        )

        self.client.force_authenticate(user=self.student1)
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
