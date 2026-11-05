from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from questions.models import Question

User = get_user_model()


class QuestionAPITests(APITestCase):
    def setUp(self):
        self.teacher1 = User.objects.create_user(
            username="teacher1",
            email="teacher1@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.teacher2 = User.objects.create_user(
            username="teacher2",
            email="teacher2@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.student = User.objects.create_user(
            username="student1",
            email="student1@evalai.com",
            password="Password123!",
            role="STUDENT",
        )

        self.question = Question.objects.create(
            teacher=self.teacher1,
            subject="Algorithms",
            title="Explain QuickSort Algorithm",
            question_text="Explain how QuickSort chooses pivot and partitions array.",
            reference_answer="QuickSort uses divide-and-conquer, partitions around pivot with average O(n log n).",
            max_marks=Decimal("10.00"),
            marking_rubric="Divide and conquer (3), Partition logic (4), Complexity (3)",
            is_active=True,
        )

        self.list_create_url = reverse("questions:question-list-create")
        self.detail_url = reverse(
            "questions:question-detail", kwargs={"pk": self.question.pk}
        )

    def test_teacher_can_create_question(self):
        """Test that a teacher can successfully create a question."""
        self.client.force_authenticate(user=self.teacher1)
        data = {
            "subject": "Data Structures",
            "title": "Explain Binary Search Trees",
            "question_text": "Define BST and its ordering invariant.",
            "reference_answer": "Left subtree < node < right subtree.",
            "max_marks": "15.00",
            "marking_rubric": "Invariant (5), Search operations (5), Balance (5)",
            "is_active": True,
        }
        response = self.client.post(self.list_create_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(
            response.data["data"]["question"]["teacher"], self.teacher1.id
        )

    def test_student_cannot_create_question(self):
        """Test that student role is forbidden from creating questions."""
        self.client.force_authenticate(user=self.student)
        data = {
            "subject": "Math",
            "title": "Calculus question",
            "question_text": "Explain limit",
            "reference_answer": "Limit concept",
            "max_marks": "10.00",
        }
        response = self.client.post(self.list_create_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data["success"])

    def test_student_cannot_see_reference_answer(self):
        """Test that students cannot view reference answers or rubrics in questions."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        question_data = response.data["data"]["question"]
        self.assertNotIn("reference_answer", question_data)
        self.assertNotIn("marking_rubric", question_data)

    def test_teacher_can_see_reference_answer(self):
        """Test that teacher can view reference answer and rubric."""
        self.client.force_authenticate(user=self.teacher1)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        question_data = response.data["data"]["question"]
        self.assertIn("reference_answer", question_data)
        self.assertIn("marking_rubric", question_data)

    def test_teacher_owner_can_update_question(self):
        """Test that teacher owner can update question."""
        self.client.force_authenticate(user=self.teacher1)
        patch_data = {"title": "Updated QuickSort Title"}
        response = self.client.patch(self.detail_url, patch_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["data"]["question"]["title"], "Updated QuickSort Title"
        )

    def test_another_teacher_cannot_update_question(self):
        """Test that another teacher cannot modify a question they do not own."""
        self.client.force_authenticate(user=self.teacher2)
        patch_data = {"title": "Malicious Title Change"}
        response = self.client.patch(self.detail_url, patch_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_list_another_teachers_questions(self):
        """A teacher's collection is private, even when ?all=true is supplied."""
        self.client.force_authenticate(user=self.teacher2)
        response = self.client.get(f"{self.list_create_url}?all=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 0)

    def test_teacher_cannot_read_another_teachers_question(self):
        self.client.force_authenticate(user=self.teacher2)
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
