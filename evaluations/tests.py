from decimal import Decimal
from unittest.mock import patch
from django.urls import reverse
from django.utils import timezone
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from questions.models import Exam, Question, SubjectResource
from submissions.models import Submission
from evaluations.models import Evaluation, QuestionEvaluation, Rubric, RubricPoint
from evaluations.services import EvaluationServiceError, validate_approved_rubric
from evaluations.services import evaluate_submission
from submissions.state import ALLOWED_TRANSITIONS, InvalidStatusTransition, transition_submission
from questions.rag_models import ExtractedQuestion, QuestionPaper
from submissions.rag_models import ExtractedStudentAnswer

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

    def add_question_result(self, evaluation, marks=None, submission_status=None):
        subject = SubjectResource.objects.create(
            teacher=self.teacher1, name=f"Review subject {evaluation.pk}"
        )
        paper = QuestionPaper.objects.create(
            subject=subject,
            document=SimpleUploadedFile("review-paper.txt", b"1. Explain the topic."),
            processing_status="COMPLETED",
        )
        question = ExtractedQuestion.objects.create(
            question_paper=paper,
            number="1.",
            text="Explain the topic.",
            maximum_marks=evaluation.max_marks,
        )
        result = QuestionEvaluation.objects.create(
            evaluation=evaluation,
            question=question,
            student_answer="The student explains the topic.",
            expected_answer="A complete explanation.",
            ai_marks=marks if marks is not None else evaluation.suggested_marks,
            awarded_marks=marks if marks is not None else evaluation.suggested_marks,
            maximum_marks=evaluation.max_marks,
            confidence=0.8,
        )
        self.submission.status = submission_status or Submission.Status.PENDING_TEACHER_REVIEW
        self.submission.save(update_fields=["status"])
        return result

    def test_submission_cannot_be_approved_without_question_level_results(self):
        self.submission.status = Submission.Status.PENDING_TEACHER_REVIEW
        self.submission.save(update_fields=["status"])

        with self.assertRaises(InvalidStatusTransition):
            transition_submission(self.submission, Submission.Status.APPROVED)

        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, Submission.Status.PENDING_TEACHER_REVIEW)

    def test_state_machine_rejects_every_disallowed_status_edge(self):
        statuses = list(ALLOWED_TRANSITIONS)
        for current, allowed in ALLOWED_TRANSITIONS.items():
            for target in statuses:
                if target == current or target in allowed:
                    continue
                with self.subTest(current=current, target=target):
                    self.submission.status = current
                    self.submission.save(update_fields=["status"])
                    with self.assertRaises(InvalidStatusTransition):
                        transition_submission(self.submission, target)

    def test_publication_requires_question_rows_and_teacher_final_marks(self):
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("6.00"),
            max_marks=Decimal("10.00"),
            feedback="Pending review.",
        )
        self.submission.status = Submission.Status.PENDING_TEACHER_REVIEW
        self.submission.save(update_fields=["status"])
        with self.assertRaisesRegex(InvalidStatusTransition, "question-level"):
            transition_submission(
                self.submission,
                Submission.Status.APPROVED,
                evaluation=evaluation,
                actor=self.teacher1,
            )

        self.add_question_result(evaluation)
        transition_submission(
            self.submission,
            Submission.Status.APPROVED,
            evaluation=evaluation,
            actor=self.teacher1,
        )
        with self.assertRaisesRegex(InvalidStatusTransition, "teacher-approved marks"):
            transition_submission(
                self.submission,
                Submission.Status.PUBLISHED,
                evaluation=evaluation,
                actor=self.teacher1,
            )

        evaluation.teacher_approved_marks = Decimal("6.00")
        evaluation.save(update_fields=["teacher_approved_marks"])
        transition_submission(
            self.submission,
            Submission.Status.PUBLISHED,
            evaluation=evaluation,
            actor=self.teacher1,
        )
        self.submission.refresh_from_db()
        evaluation.refresh_from_db()
        self.assertEqual(self.submission.status, Submission.Status.PUBLISHED)
        self.assertEqual(evaluation.status, Evaluation.Status.PUBLISHED)
        self.assertIsNotNone(evaluation.published_at)

    @patch("evaluations.views.evaluate_submission")
    def test_mocked_ai_evaluation(self, mock_evaluate):
        """Test AI evaluation endpoint with a mocked Groq service."""
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

    def test_eadaes_grading_requires_ready_approved_rubric(self):
        subject = SubjectResource.objects.create(teacher=self.teacher1, name="Rubric Subject")
        exam = Exam.objects.create(subject=subject, name="Midterm", total_marks=Decimal("10.00"))
        question = Question.objects.create(
            teacher=self.teacher1,
            exam=exam,
            subject=subject.name,
            title="Rubric question",
            question_text="Explain the topic.",
            reference_answer="A correct explanation.",
            max_marks=Decimal("10.00"),
        )
        with self.assertRaises(EvaluationServiceError):
            validate_approved_rubric(question)
        rubric = Rubric.objects.create(question=question, status=Rubric.Status.APPROVED)
        RubricPoint.objects.create(rubric=rubric, text="Core explanation", marks=Decimal("10.00"))
        with self.assertRaises(EvaluationServiceError):
            validate_approved_rubric(question)
        exam.status = Exam.Status.READY
        exam.save(update_fields=["status"])
        self.assertEqual(validate_approved_rubric(question), rubric)

    def test_teacher_can_approve_exact_rubric_through_api(self):
        subject = SubjectResource.objects.create(teacher=self.teacher1, name="API Rubric Subject")
        exam = Exam.objects.create(subject=subject, name="Final", total_marks=Decimal("5.00"), status=Exam.Status.READY)
        question = Question.objects.create(
            teacher=self.teacher1,
            exam=exam,
            subject=subject.name,
            title="Explain API rubric",
            question_text="Explain the concept.",
            reference_answer="A complete explanation.",
            max_marks=Decimal("5.00"),
        )
        self.client.force_authenticate(user=self.teacher1)
        response = self.client.put(
            reverse("questions:question-rubric", kwargs={"question_id": question.id}),
            {"model_answer": "A complete explanation.", "points": [{"order": 1, "text": "Core concept", "marks": "5.00", "keywords": ["concept"]}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["rubric"]["status"], "approved")

    def test_exam_cannot_be_marked_ready_without_all_rubrics(self):
        subject = SubjectResource.objects.create(teacher=self.teacher1, name="Ready Gate Subject")
        exam = Exam.objects.create(subject=subject, name="Gate Exam", total_marks=Decimal("5.00"))
        Question.objects.create(
            teacher=self.teacher1, exam=exam, subject=subject.name, title="Gate Q1",
            question_text="Explain.", reference_answer="Correct.", max_marks=Decimal("5.00"),
        )
        self.client.force_authenticate(user=self.teacher1)
        response = self.client.patch(reverse("questions:exam-detail", kwargs={"pk": exam.id}), {"status": "ready"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rubric", response.data["errors"]["status"])

    def test_exam_cannot_be_created_ready(self):
        subject = SubjectResource.objects.create(teacher=self.teacher1, name="Create Ready Gate")
        self.client.force_authenticate(user=self.teacher1)
        response = self.client.post(
            reverse("questions:exam-list-create"),
            {"subject": subject.id, "name": "Invalid Ready", "total_marks": "10.00", "status": "ready"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_view_pending_evaluation_detail(self):
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("7.00"),
            max_marks=Decimal("10.00"),
            feedback="Pending feedback.",
            confidence=0.8,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )
        detail_url = reverse(
            "submissions:submission-evaluation-detail",
            kwargs={"submission_id": self.submission.id},
        )

        self.client.force_authenticate(user=self.student1)
        response = self.client.get(detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["evaluation"], {
            "id": evaluation.id,
            "submission_id": self.submission.id,
            "status": "PENDING_TEACHER_REVIEW",
            "message": "Awaiting teacher review",
        })

    def test_student_can_view_approved_evaluation_detail_with_feedback(self):
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("7.00"),
            max_marks=Decimal("10.00"),
            feedback="Mention the initial sequence number.",
            confidence=0.8,
            teacher_approved_marks=Decimal("8.00"),
            teacher_review_status=Evaluation.ReviewStatus.APPROVED,
            status=Evaluation.Status.PUBLISHED,
            published_at=timezone.now(),
            teacher_comments="Approved after review.",
        )
        detail_url = reverse(
            "submissions:submission-evaluation-detail",
            kwargs={"submission_id": self.submission.id},
        )

        self.client.force_authenticate(user=self.student1)
        response = self.client.get(detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data["data"]["evaluation"]
        self.assertEqual(result["final_marks"], "8.00")
        self.assertEqual(result["teacher_comments"], "Approved after review.")

    def test_teacher_approves_evaluation(self):
        """Test teacher approving AI suggested marks (separate from publishing)."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("8.00"),
            max_marks=Decimal("10.00"),
            feedback="Initial feedback.",
            confidence=0.92,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )
        self.add_question_result(evaluation)
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
        self.assertEqual(evaluation.submission.status, Submission.Status.APPROVED)
        self.assertIsNone(evaluation.published_at)
        self.assertTrue(evaluation.report_document.name)
        self.assertTrue(response.data["data"]["evaluation"]["report_document"])

    def test_teacher_approves_and_publishes_in_single_step(self):
        """Test unified approve & publish endpoint."""
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("8.00"),
            max_marks=Decimal("10.00"),
            feedback="Initial feedback.",
            confidence=0.95,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )
        self.add_question_result(evaluation)
        approve_pub_url = reverse(
            "evaluations:evaluation-approve-and-publish", kwargs={"pk": evaluation.pk}
        )
        self.client.force_authenticate(user=self.teacher1)
        response = self.client.post(
            approve_pub_url, {"teacher_comments": "Looks great, approved & published."}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        evaluation.refresh_from_db()
        self.assertEqual(evaluation.teacher_review_status, Evaluation.ReviewStatus.APPROVED)
        self.assertEqual(evaluation.status, Evaluation.Status.PUBLISHED)
        self.assertIsNotNone(evaluation.published_at)
        self.assertEqual(evaluation.published_by, self.teacher1)
        self.assertEqual(evaluation.submission.status, Submission.Status.PUBLISHED)

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
        self.submission.status = Submission.Status.PENDING_TEACHER_REVIEW
        self.submission.save(update_fields=["status"])
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
        self.assertEqual(evaluation.teacher_review_status, Evaluation.ReviewStatus.PENDING)
        self.assertEqual(evaluation.teacher_approved_marks, Decimal("8.50"))
        # Verify original AI mark is preserved!
        self.assertEqual(evaluation.suggested_marks, Decimal("6.50"))

    def test_modified_evaluation_requires_publish_for_student(self):
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("6.50"),
            max_marks=Decimal("10.00"),
            feedback="Feedback.",
            confidence=0.88,
            teacher_approved_marks=Decimal("8.50"),
            teacher_review_status=Evaluation.ReviewStatus.MODIFIED,
            status=Evaluation.Status.APPROVED,
        )
        self.add_question_result(evaluation, marks=Decimal("8.50"), submission_status=Submission.Status.APPROVED)
        detail_url = reverse("submissions:submission-evaluation-detail", kwargs={"submission_id": self.submission.id})
        self.client.force_authenticate(user=self.student1)
        pending = self.client.get(detail_url)
        self.assertEqual(pending.status_code, status.HTTP_200_OK)
        self.assertEqual(set(pending.data["data"]["evaluation"]), {"id", "submission_id", "status", "message"})
        self.client.force_authenticate(user=self.teacher1)
        publish = self.client.post(reverse("evaluations:evaluation-publish", kwargs={"pk": evaluation.id}))
        self.assertEqual(publish.status_code, status.HTTP_200_OK)
        self.client.force_authenticate(user=self.student1)
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_200_OK)

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

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("evaluations.services.chat")
    @override_settings(EVAL_LLM_MOCK=False)
    def test_grok_output_cannot_change_question_mark_allocation(self, mock_chat):
        subject = SubjectResource.objects.create(
            teacher=self.teacher1,
            name=self.question.subject,
        )
        paper = QuestionPaper.objects.create(
            subject=subject,
            document=SimpleUploadedFile("marks.txt", b"1. Explain TCP (8 marks)"),
            extracted_text="1. Explain TCP (8 marks)",
            processing_status="COMPLETED",
        )
        extracted = ExtractedQuestion.objects.create(
            question_paper=paper,
            number="1.",
            text="Explain TCP",
            maximum_marks=Decimal("8.00"),
        )
        mock_chat.return_value = """{
            "suggested_marks": 99,
            "confidence": 150,
            "feedback": "Review the answer.",
            "question_evaluations": [{
                "question_number": "Question 1",
                "maximum_marks": 99,
                "awarded_marks": 99,
                "confidence": "invalid",
                "requires_teacher_review": "false"
            }]
        }"""

        evaluation = evaluate_submission(self.submission)

        self.assertEqual(evaluation.suggested_marks, Decimal("8.00"))
        question_evaluation = evaluation.question_evaluations.get(question=extracted)
        self.assertEqual(question_evaluation.maximum_marks, Decimal("8.00"))
        self.assertEqual(question_evaluation.awarded_marks, Decimal("8.00"))
        self.assertEqual(question_evaluation.ai_marks, Decimal("8.00"))
        self.assertEqual(question_evaluation.confidence, 0.0)
        self.assertTrue(question_evaluation.requires_teacher_review)

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("evaluations.services.chat")
    @override_settings(EVAL_LLM_MOCK=False)
    def test_provider_json_repair_receives_question_ids_and_grading_context(self, mock_chat):
        import json

        subject = SubjectResource.objects.create(teacher=self.teacher1, name=self.question.subject)
        paper = QuestionPaper.objects.create(
            subject=subject,
            document=SimpleUploadedFile("repair-paper.txt", b"1. Explain TCP (8 marks)"),
            extracted_text="1. Explain TCP (8 marks)",
            processing_status="COMPLETED",
        )
        extracted = ExtractedQuestion.objects.create(
            question_paper=paper,
            number="1.",
            text="Explain TCP",
            maximum_marks=Decimal("8.00"),
        )
        self.submission.subject = subject
        self.submission.question_paper = paper
        self.submission.save(update_fields=["subject", "question_paper"])
        repaired = {
            "suggested_marks": 5,
            "confidence": 0.75,
            "feedback": "The answer explains the handshake sequence.",
            "question_evaluations": [{
                "question_number": "Question 1",
                "maximum_marks": 8,
                "awarded_marks": 5,
                "student_answer": self.submission.answer_text,
                "expected_answer": "SYN, SYN-ACK, and ACK establish the connection.",
                "correct_points": ["Identifies the handshake packets."],
                "mistakes": [],
                "missing_concepts": [],
                "justification": "The answer gives the correct three-message exchange.",
                "improvement_suggestions": [],
                "evidence": [],
                "reference_evidence": [],
                "flags": [],
                "confidence": 0.75,
            }],
        }
        mock_chat.side_effect = [
            json.dumps({"suggested_marks": 0, "question_evaluations": []}),
            json.dumps(repaired),
        ]

        evaluation = evaluate_submission(self.submission)

        self.assertEqual(mock_chat.call_count, 2)
        self.assertIn('"question_number": "1."', mock_chat.call_args_list[1].args[0])
        self.assertIn(self.submission.answer_text, mock_chat.call_args_list[1].args[0])
        self.assertEqual(mock_chat.call_args_list[0].kwargs["max_tokens"], 650)
        self.assertEqual(mock_chat.call_args_list[1].kwargs["max_tokens"], 380)
        self.assertEqual(evaluation.question_evaluations.get(question=extracted).awarded_marks, Decimal("5.00"))

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("evaluations.services.chat")
    @override_settings(EVAL_LLM_MOCK=False)
    def test_provider_repair_fills_only_missing_question_and_preserves_valid_rows(self, mock_chat):
        import json

        subject = SubjectResource.objects.create(teacher=self.teacher1, name="Partial repair subject")
        paper = QuestionPaper.objects.create(
            subject=subject,
            document=SimpleUploadedFile("partial-repair.txt", b"1. Define TCP. 2. Explain congestion control."),
            extracted_text="1. Define TCP.\n2. Explain congestion control.",
            processing_status="COMPLETED",
        )
        first_question = ExtractedQuestion.objects.create(
            question_paper=paper, number="1.", text="Define TCP.", maximum_marks=Decimal("4.00")
        )
        second_question = ExtractedQuestion.objects.create(
            question_paper=paper, number="2.", text="Explain congestion control.", maximum_marks=Decimal("6.00")
        )
        self.submission.subject = subject
        self.submission.question_paper = paper
        self.submission.save(update_fields=["subject", "question_paper"])
        first_row = {
            "question_number": "Question 1",
            "maximum_marks": 4,
            "awarded_marks": 3,
            "expected_answer": "TCP provides reliable transport.",
            "correct_points": ["Identifies reliable transport."],
            "mistakes": [],
            "missing_concepts": [],
            "justification": "The definition is mostly accurate.",
            "improvement_suggestions": [],
            "evidence": [],
            "reference_evidence": [],
            "flags": [],
            "confidence": 0.8,
        }
        second_row = {
            **first_row,
            "question_number": "2",
            "maximum_marks": 6,
            "awarded_marks": 5,
            "expected_answer": "Congestion control limits traffic to prevent network overload.",
        }
        mock_chat.side_effect = [
            json.dumps({"suggested_marks": 8, "question_evaluations": [first_row]}),
            json.dumps({"question_evaluations": [second_row]}),
        ]

        evaluation = evaluate_submission(self.submission)

        self.assertEqual(mock_chat.call_count, 2)
        repair_prompt = mock_chat.call_args_list[1].args[0]
        self.assertIn('"question_number": "2."', repair_prompt)
        self.assertIn("Already validated rows to preserve unchanged", repair_prompt)
        self.assertEqual(mock_chat.call_args_list[0].kwargs["max_tokens"], 900)
        self.assertEqual(mock_chat.call_args_list[1].kwargs["max_tokens"], 380)
        self.assertEqual(evaluation.question_evaluations.count(), 2)
        self.assertEqual(evaluation.question_evaluations.get(question=first_question).awarded_marks, Decimal("3.00"))
        self.assertEqual(evaluation.question_evaluations.get(question=second_question).awarded_marks, Decimal("5.00"))

    @override_settings(EVAL_LLM_MOCK=True)
    def test_deterministic_mock_evaluation_returns_bounded_question_marks(self):
        subject = SubjectResource.objects.create(teacher=self.teacher1, name=self.question.subject)
        paper = QuestionPaper.objects.create(
            subject=subject,
            document=SimpleUploadedFile("mock-paper.txt", b"1. Explain TCP (8 marks)"),
            extracted_text="1. Explain TCP (8 marks)",
            processing_status="COMPLETED",
        )
        extracted = ExtractedQuestion.objects.create(
            question_paper=paper,
            number="1.",
            text="Explain TCP",
            maximum_marks=Decimal("8.00"),
        )
        ExtractedStudentAnswer.objects.create(
            submission=self.submission,
            question=extracted,
            answer_text="TCP establishes a connection with SYN, SYN-ACK, and ACK messages.",
            processing_status="COMPLETED",
        )

        evaluation = evaluate_submission(self.submission)
        question_result = evaluation.question_evaluations.get(question=extracted)

        self.assertLessEqual(question_result.awarded_marks, question_result.maximum_marks)
        self.assertEqual(evaluation.suggested_marks, question_result.awarded_marks)
        self.assertEqual(question_result.confidence, 0.3)
        self.assertIn("mock_ai", question_result.flags)
        self.assertEqual(self.submission.status, Submission.Status.PENDING_TEACHER_REVIEW)

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("evaluations.services.chat")
    @override_settings(EVAL_LLM_MOCK=False, LLM_CONFIDENCE_THRESHOLD=0.9)
    def test_low_confidence_flag_uses_configured_threshold(self, mock_chat):
        import json

        subject = SubjectResource.objects.create(teacher=self.teacher1, name="Threshold subject")
        paper = QuestionPaper.objects.create(
            subject=subject,
            document=SimpleUploadedFile("threshold-paper.txt", b"1. Explain TCP (8 marks)"),
            extracted_text="1. Explain TCP (8 marks)",
            processing_status="COMPLETED",
        )
        extracted = ExtractedQuestion.objects.create(
            question_paper=paper,
            number="1.",
            text="Explain TCP",
            maximum_marks=Decimal("8.00"),
        )
        self.submission.subject = subject
        self.submission.question_paper = paper
        self.submission.save(update_fields=["subject", "question_paper"])
        mock_chat.return_value = json.dumps({
            "suggested_marks": 5,
            "confidence": 0.8,
            "feedback": "Mostly correct explanation.",
            "question_evaluations": [{
                "question_number": "1",
                "maximum_marks": 8,
                "awarded_marks": 5,
                "expected_answer": "TCP establishes a reliable connection.",
                "correct_points": ["Identifies reliable transport."],
                "mistakes": [],
                "missing_concepts": [],
                "justification": "The response covers the central concept.",
                "improvement_suggestions": [],
                "evidence": [],
                "reference_evidence": [],
                "flags": [],
                "confidence": 0.8,
            }],
        })

        evaluation = evaluate_submission(self.submission)
        question_result = evaluation.question_evaluations.get(question=extracted)

        self.assertIn("low_confidence", question_result.flags)
        self.assertTrue(question_result.requires_teacher_review)
        self.assertTrue(evaluation.needs_attention)

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("evaluations.services.chat")
    def test_quote_verification_drops_hallucinated_quotes_and_adds_flag(self, mock_chat):
        from evaluations.services import verify_student_quote
        # Direct verification function unit test
        transcript = "The TCP three-way handshake establishes a reliable connection using SYN and ACK."
        # Real quote
        is_valid = verify_student_quote("three-way handshake establishes a reliable connection", transcript)
        self.assertTrue(is_valid)

        # Hallucinated quote
        is_invalid = verify_student_quote("UDP is a connectionless protocol without handshakes", transcript)
        self.assertFalse(is_invalid)

    def test_teacher_update_marks_with_question_breakdown_and_override_reason(self):
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("7.00"),
            max_marks=Decimal("10.00"),
            feedback="Initial feedback.",
            confidence=0.85,
            teacher_review_status=Evaluation.ReviewStatus.PENDING,
        )
        sub_res = SubjectResource.objects.create(teacher=self.teacher1, name="Test Sub for QE")
        qp = QuestionPaper.objects.create(
            subject=sub_res,
            document=SimpleUploadedFile("paper.txt", b"1. Q"),
            processing_status="COMPLETED",
        )
        eq = ExtractedQuestion.objects.create(
            question_paper=qp,
            number="1.",
            text="Explain concept",
            maximum_marks=Decimal("10.00"),
        )
        qe = QuestionEvaluation.objects.create(
            evaluation=evaluation,
            question=eq,
            maximum_marks=Decimal("10.00"),
            awarded_marks=Decimal("7.00"),
            ai_marks=Decimal("7.00"),
            confidence=0.85,
        )
        self.submission.status = Submission.Status.PENDING_TEACHER_REVIEW
        self.submission.save(update_fields=["status"])
        update_url = reverse("evaluations:evaluation-update-marks", kwargs={"pk": evaluation.pk})
        self.client.force_authenticate(user=self.teacher1)

        payload = {
            "approved_marks": Decimal("9.50"),
            "teacher_comments": "Updated after manual audit",
            "question_evaluations": [
                {
                    "id": qe.id,
                    "awarded_marks": Decimal("9.50"),
                    "teacher_override_reason": "Student explained the concept adequately with diagrams.",
                    "teacher_comments": "Great diagrams.",
                }
            ],
        }
        res = self.client.post(update_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        qe.refresh_from_db()
        self.assertEqual(qe.awarded_marks, Decimal("9.50"))
        self.assertEqual(qe.ai_marks, Decimal("7.00"))  # Auditable original preserved
        self.assertEqual(qe.teacher_override_reason, "Student explained the concept adequately with diagrams.")

        evaluation.refresh_from_db()
        self.assertEqual(evaluation.teacher_approved_marks, Decimal("9.50"))

    def test_authenticated_report_download_permissions(self):
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            suggested_marks=Decimal("8.00"),
            max_marks=Decimal("10.00"),
            status=Evaluation.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        # Create dummy report document
        evaluation.report_document.save("report.pdf", SimpleUploadedFile("report.pdf", b"%PDF dummy content"))
        report_url = reverse("evaluations:evaluation-report-download", kwargs={"pk": evaluation.pk})

        # Teacher owner can download
        self.client.force_authenticate(user=self.teacher1)
        res_t = self.client.get(report_url)
        self.assertEqual(res_t.status_code, status.HTTP_200_OK)

        # Enrolled student owner can download
        self.client.force_authenticate(user=self.student1)
        res_s = self.client.get(report_url)
        self.assertEqual(res_s.status_code, status.HTTP_200_OK)

        # Other students cannot discover another student's private report.
        self.client.force_authenticate(user=self.student2)
        res_other = self.client.get(report_url)
        self.assertEqual(res_other.status_code, status.HTTP_404_NOT_FOUND)
