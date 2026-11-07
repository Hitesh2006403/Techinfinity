from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from django.contrib.auth import get_user_model
from tempfile import TemporaryDirectory
from pathlib import Path
from rest_framework.exceptions import ValidationError
from questions.models import Enrollment, Exam, Question, SubjectResource
from questions.rag_models import QuestionPaper
from rag.services import process_question_paper, process_reference_document, process_student_answers
from submissions.models import Submission
from evaluations.models import Evaluation
from evaluations.models import Rubric, RubricPoint
from unittest.mock import patch
from rag.validation import MAX_DOCUMENT_SIZE, validate_answer_sheet_upload

User = get_user_model()


class AnswerSheetValidationTests(SimpleTestCase):
    def make_pdf(self, **save_options):
        import pymupdf as fitz

        document = fitz.open()
        document.new_page().insert_text((72, 72), "Answer sheet test page")
        return document.tobytes(**save_options)

    def test_valid_pdf_answer_sheet_is_accepted(self):
        upload = SimpleUploadedFile("answers.pdf", self.make_pdf(), content_type="application/pdf")
        self.assertIs(validate_answer_sheet_upload(upload), upload)

    def test_corrupt_and_encrypted_pdfs_are_rejected(self):
        import pymupdf as fitz

        corrupt = SimpleUploadedFile("answers.pdf", b"%PDF-not a document")
        encrypted_bytes = self.make_pdf(
            encryption=fitz.PDF_ENCRYPT_AES_256,
            owner_pw="test-owner",
            user_pw="test-user",
        )
        encrypted = SimpleUploadedFile("locked.pdf", encrypted_bytes)
        for upload in (corrupt, encrypted):
            with self.subTest(filename=upload.name), self.assertRaises(ValidationError):
                validate_answer_sheet_upload(upload)

    def test_answer_sheet_rejects_unsupported_formats_and_mismatched_signatures(self):
        unsupported = SimpleUploadedFile("answers.txt", b"1. answer")
        fake_image = SimpleUploadedFile("answers.png", b"not a PNG")
        for upload in (unsupported, fake_image):
            with self.subTest(filename=upload.name), self.assertRaises(ValidationError):
                validate_answer_sheet_upload(upload)

    def test_oversized_documents_are_rejected_before_parsing(self):
        upload = SimpleUploadedFile("large.pdf", b"x" * (MAX_DOCUMENT_SIZE + 1))
        with self.assertRaises(ValidationError):
            validate_answer_sheet_upload(upload)

    def test_debug_server_does_not_expose_private_media_files(self):
        with TemporaryDirectory() as directory:
            private_file = Path(directory) / "answer_sheets" / "private.pdf"
            private_file.parent.mkdir(parents=True)
            private_file.write_bytes(self.make_pdf())
            with override_settings(DEBUG=True, MEDIA_ROOT=directory):
                response = self.client.get("/media/answer_sheets/private.pdf")
        self.assertEqual(response.status_code, 404)


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
        submission = response.data["data"]["submission"]
        self.assertEqual(set(submission), {"id", "status", "message"})
        self.assertEqual(submission["status"], "UPLOADED")
        self.assertEqual(submission["message"], "Awaiting teacher review")

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
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_submission_is_minimal_before_ai_evaluation_exists(self):
        self.submission1.status = Submission.Status.UPLOADED
        self.submission1.answer_text = "Private answer transcription before evaluation."
        self.submission1.processing_error = "Internal provider details must stay private."
        self.submission1.answer_document = SimpleUploadedFile(
            "private-answer.pdf", b"%PDF-1.4 private answer document"
        )
        self.submission1.save(
            update_fields=["status", "answer_text", "processing_error", "answer_document"]
        )

        self.client.force_authenticate(user=self.student1)
        detail = self.client.get(self.detail_url)
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        pending = detail.data["data"]["submission"]
        self.assertEqual(set(pending), {"id", "status", "message"})
        self.assertEqual(pending["status"], Submission.Status.UPLOADED)
        self.assertEqual(pending["message"], "Awaiting teacher review")

        listing = self.client.get(self.list_create_url)
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        listed = listing.data["data"]["submissions"][0]
        self.assertEqual(set(listed), {"id", "status", "message"})

    def test_question_teacher_can_view_student_submission(self):
        """Test that the question's teacher can view student's submission."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["data"]["submission"]["id"], self.submission1.id
        )

    @patch("rag.services.process_student_answers")
    def test_duplicate_processing_task_does_not_repeat_work(self, mock_extract):
        from submissions.tasks import process_uploaded_submission

        self.submission1.status = Submission.Status.PROCESSING
        self.submission1.save(update_fields=["status"])
        result = process_uploaded_submission.apply(args=(self.submission1.id, None)).get()

        self.assertTrue(result["duplicate"])
        self.assertEqual(result["status"], Submission.Status.PROCESSING)
        mock_extract.assert_not_called()

    def test_stuck_uploaded_job_is_failed_for_teacher_retry(self):
        from datetime import timedelta
        from django.utils import timezone
        from submissions.tasks import fail_stuck_submissions

        processing = Submission.objects.create(
            question=self.submission1.question,
            student=self.submission1.student,
            answer_text="A processing task that became stuck.",
            status=Submission.Status.PROCESSING,
            processing_started_at=timezone.now() - timedelta(minutes=10),
        )
        Submission.objects.filter(pk=self.submission1.pk).update(
            status=Submission.Status.UPLOADED,
            submitted_at=timezone.now() - timedelta(minutes=10),
        )
        result = fail_stuck_submissions.run(timeout_seconds=60)

        self.submission1.refresh_from_db()
        self.assertEqual(self.submission1.status, Submission.Status.FAILED)
        self.assertIn("did not start", self.submission1.processing_error)
        self.assertIn(self.submission1.pk, result["failed_submission_ids"])
        processing.refresh_from_db()
        self.assertEqual(processing.status, Submission.Status.FAILED)
        self.assertIn("processing timeout", processing.processing_error.lower())
        self.assertIn(processing.pk, result["failed_submission_ids"])


class MappedAnswerSheetFlowTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="mapped_teacher",
            email="mapped_teacher@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.student = User.objects.create_user(
            username="mapped_student",
            email="mapped_student@evalai.com",
            password="Password123!",
            role="STUDENT",
        )
        self.subject = SubjectResource.objects.create(
            teacher=self.teacher,
            name="Mapped Subject",
            notes_description="Award marks for correctness and method.",
        )
        Enrollment.objects.create(subject=self.subject, student=self.student)
        self.non_enrolled_student = User.objects.create_user(
            username="non_enrolled_student",
            email="non_enrolled@evalai.com",
            password="Password123!",
            role="STUDENT",
        )
        process_reference_document(
            self.subject,
            SimpleUploadedFile(
                "mapped-reference.txt",
                b"Recursion solves a problem by reducing it to a smaller input.",
            ),
        )
        self.client.force_authenticate(user=self.teacher)
        paper = SimpleUploadedFile(
            "mapped-paper.txt",
            b"1. Explain recursion (10 marks)",
            content_type="text/plain",
        )
        response = self.client.post(
            reverse("submissions:raw-answer-sheet-upload"),
            {
                "document_type": "QUESTION_PAPER",
                "subject": self.subject.id,
                "document": paper,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(QuestionPaper.objects.filter(subject=self.subject).exists())

    def test_failed_latest_reference_blocks_upload_instead_of_using_an_older_reference(self):
        process_reference_document(
            self.subject,
            SimpleUploadedFile("unreadable-reference.pdf", b"%PDF-invalid"),
        )
        response = self.client.post(
            reverse("submissions:mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.student.id,
                "document": SimpleUploadedFile("answer.txt", b"Student answer"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Reference PDF processing failed", response.data["message"])
        self.assertFalse(Submission.objects.filter(student=self.student).exists())

    def test_failed_latest_question_paper_blocks_upload_with_processing_error(self):
        process_question_paper(
            self.subject,
            SimpleUploadedFile("unreadable-paper.pdf", b"%PDF-invalid"),
        )
        response = self.client.post(
            reverse("submissions:mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.student.id,
                "document": SimpleUploadedFile("answer.txt", b"Student answer"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("question paper", response.data["message"].lower())
        self.assertFalse(Submission.objects.filter(student=self.student).exists())

    @patch("rag.services.process_student_answers")
    @patch("evaluations.services.evaluate_submission")
    def test_mapped_answer_sheet_is_linked_and_sent_for_review_on_ai_failure(self, mock_evaluate, mock_extract):
        def set_extracted_answer(submission, _question_paper):
            submission.answer_text = "1. Recursion solves a problem by calling the same function on a smaller input."
            submission.save(update_fields=["answer_text"])

        mock_extract.side_effect = set_extracted_answer
        mock_evaluate.side_effect = RuntimeError("Groq unavailable")
        answer = SimpleUploadedFile(
            "student-answer.txt",
            b"1. Recursion solves a problem by calling the same function on a smaller input.",
            content_type="text/plain",
        )
        response = self.client.post(
            reverse("submissions:mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.student.id,
                "document": answer,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = Submission.objects.get(student=self.student)
        upload = submission.source_answer_sheet
        self.assertEqual(upload.subject_id, self.subject.id)
        self.assertEqual(upload.student_id, self.student.id)
        self.assertEqual(upload.submission_id, submission.id)
        self.assertEqual(submission.status, Submission.Status.FAILED)
        self.assertIn("Groq unavailable", submission.processing_error)
        self.assertFalse(Evaluation.objects.filter(submission=submission).exists())

    @override_settings(EVAL_LLM_MOCK=False, GROQ_VISION_BATCH_SIZE=3)
    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("rag.services.chat")
    def test_scanned_answer_transcription_batches_all_pages_in_order(self, mock_chat):
        import json
        import pymupdf as fitz

        def transcribe(_prompt, file_parts, json_mode=True, max_tokens=None):
            page_numbers = [part["page_no"] for part in file_parts]
            return json.dumps({
                "pages": [
                    {"page_number": number, "text": f"1. Answer content from scanned page {number}."}
                    for number in page_numbers
                ]
            })

        mock_chat.side_effect = transcribe
        pdf = fitz.open()
        for _ in range(7):
            pdf.new_page()
        paper = self.subject.question_papers.first()
        question = Question.objects.get(teacher=self.teacher, subject=self.subject.name)
        submission = Submission.objects.create(
            question=question,
            student=self.student,
            subject=self.subject,
            question_paper=paper,
            reference_document=self.subject.reference_documents.first(),
            answer_document=SimpleUploadedFile("seven-page-scan.pdf", pdf.tobytes()),
        )

        process_student_answers(submission, paper)

        submission.refresh_from_db()
        self.assertEqual(mock_chat.call_count, 3)
        self.assertEqual(submission.extraction_metadata["failed_vision_pages"], [])
        self.assertEqual(submission.extraction_metadata["transcription_mode"], "groq_vision")
        positions = [submission.answer_text.index(f"page {number}") for number in range(1, 8)]
        self.assertEqual(positions, sorted(positions))

    @override_settings(EVAL_LLM_MOCK=False)
    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("rag.services.chat", side_effect=RuntimeError("Groq request failed with HTTP 429"))
    def test_handwriting_provider_error_is_preserved_for_teacher_retry(self, mock_chat):
        import pymupdf as fitz
        from submissions.tasks import process_uploaded_submission

        pdf = fitz.open()
        pdf.new_page()
        paper = self.subject.question_papers.first()
        question = Question.objects.get(teacher=self.teacher, subject=self.subject.name)
        submission = Submission.objects.create(
            question=question,
            student=self.student,
            subject=self.subject,
            question_paper=paper,
            reference_document=self.subject.reference_documents.first(),
            answer_document=SimpleUploadedFile("unreadable-scan.pdf", pdf.tobytes()),
        )

        result = process_uploaded_submission.apply(args=(submission.id, paper.id)).get()

        submission.refresh_from_db()
        self.assertEqual(result["status"], Submission.Status.FAILED)
        self.assertIn("Groq request failed with HTTP 429", submission.processing_error)
        self.assertEqual(submission.extraction_metadata["failed_vision_pages"], [1])
        self.assertFalse(Evaluation.objects.filter(submission=submission).exists())
        mock_chat.assert_called_once()

    def test_eadaes_mapped_endpoint_rejects_non_pdf(self):
        response = self.client.post(
            reverse("submissions:eadaes-mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.student.id,
                "document": SimpleUploadedFile("student-answer.txt", b"answer"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eadaes_mapped_endpoint_requires_ready_rubrics(self):
        import pymupdf as fitz
        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "1. Explain recursion")
        response = self.client.post(
            reverse("submissions:eadaes-mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.student.id,
                "document": SimpleUploadedFile("student-answer.pdf", pdf.tobytes(), content_type="application/pdf"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("READY", response.data["errors"]["detail"])

    def test_eadaes_mapped_endpoint_accepts_ready_exam_and_rubric(self):
        exam = Exam.objects.create(subject=self.subject, name="Mapped EADAES Exam", total_marks=Decimal("10.00"))
        extracted_question = Question.objects.filter(subject=self.subject.name, title__contains="1.").first()
        extracted_question.exam = exam
        extracted_question.max_marks = Decimal("10.00")
        extracted_question.save(update_fields=["exam", "max_marks"])
        rubric = Rubric.objects.create(question=extracted_question, status=Rubric.Status.APPROVED)
        RubricPoint.objects.create(rubric=rubric, text="Correct recursive explanation", marks=Decimal("10.00"))
        exam.status = Exam.Status.READY
        exam.save(update_fields=["status"])
        import pymupdf as fitz
        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "1. Recursion solves a problem by reducing it to a smaller input.")
        response = self.client.post(
            reverse("submissions:eadaes-mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.student.id,
                "document": SimpleUploadedFile("ready-answer.pdf", pdf.tobytes(), content_type="application/pdf"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Submission.objects.filter(student=self.student).count(), 1)

    @patch("rag.services.process_student_answers")
    @patch("evaluations.services.evaluate_submission")
    def test_answer_extraction_failure_still_creates_teacher_review(self, mock_evaluate, mock_extract):
        mock_extract.side_effect = RuntimeError("Unreadable answer document")
        mock_evaluate.side_effect = RuntimeError("Groq unavailable")
        answer = SimpleUploadedFile(
            "unreadable-answer.txt",
            b"unreadable source",
            content_type="text/plain",
        )
        response = self.client.post(
            reverse("submissions:mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.student.id,
                "document": answer,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = Submission.objects.get(student=self.student)
        self.assertEqual(submission.status, Submission.Status.FAILED)
        self.assertIn("Unreadable answer document", submission.processing_error)
        self.assertFalse(Evaluation.objects.filter(submission=submission).exists())

    def test_upload_rejected_for_non_enrolled_student(self):
        answer = SimpleUploadedFile(
            "student-answer.txt",
            b"Recursion answer.",
            content_type="text/plain",
        )
        response = self.client.post(
            reverse("submissions:mapped-answer-sheet-upload"),
            {
                "subject_id": self.subject.id,
                "student_id": self.non_enrolled_student.id,
                "document": answer,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not enrolled", response.data["message"].lower())

    @override_settings(CELERY_TASK_ALWAYS_EAGER=False)
    @patch("submissions.views.process_uploaded_submission.delay")
    def test_reupload_creates_a_separate_attempt_for_the_same_student(self, mock_delay):
        import pymupdf as fitz

        def make_pdf(answer):
            pdf = fitz.open()
            pdf.new_page().insert_text((72, 72), answer)
            return pdf.tobytes()

        endpoint = reverse(
            "submissions:subject-answer-sheet-upload",
            kwargs={"subject_id": self.subject.id},
        )
        created = []
        for filename, answer in (
            ("attempt-one.pdf", "1. First answer."),
            ("attempt-two.pdf", "1. Revised answer."),
        ):
            response = self.client.post(
                endpoint,
                {
                    "subject_id": self.subject.id,
                    "student_id": self.student.id,
                    "document": SimpleUploadedFile(filename, make_pdf(answer), content_type="application/pdf"),
                },
                format="multipart",
            )
            self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
            created.append(response.data["data"]["submission"])

        self.assertNotEqual(created[0]["id"], created[1]["id"])
        attempts = Submission.objects.filter(subject=self.subject, student=self.student).order_by("id")
        self.assertEqual(attempts.count(), 2)
        self.assertEqual(attempts[0].question_paper_id, attempts[1].question_paper_id)
        self.assertEqual(attempts[0].reference_document_id, attempts[1].reference_document_id)
        stored_names = [attempt.answer_document.name.split("/")[-1] for attempt in attempts]
        self.assertNotEqual(stored_names[0], stored_names[1])
        self.assertTrue(stored_names[0].startswith("attempt-one"))
        self.assertTrue(stored_names[1].startswith("attempt-two"))
        self.assertEqual(mock_delay.call_count, 2)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=False)
    @patch("submissions.views.process_uploaded_submission.delay")
    def test_failed_submission_retry_is_queued_for_task_claim(self, mock_delay):
        paper = QuestionPaper.objects.filter(subject=self.subject).first()
        question = Question.objects.filter(teacher=self.teacher, subject=self.subject.name).first()
        submission = Submission.objects.create(
            subject=self.subject,
            question_paper=paper,
            reference_document=self.subject.reference_documents.first(),
            question=question,
            student=self.student,
            answer_document=SimpleUploadedFile("retry-answer.txt", b"1. Retry answer."),
            status=Submission.Status.FAILED,
        )

        response = self.client.post(
            reverse("submissions:submission-retry", kwargs={"submission_id": submission.id})
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        submission.refresh_from_db()
        self.assertEqual(submission.status, Submission.Status.UPLOADED)
        mock_delay.assert_called_once_with(submission.id, paper.id)

    @override_settings(EVAL_LLM_MOCK=True)
    def test_failed_submission_retry_can_complete_a_new_evaluation(self):
        import pymupdf as fitz
        from submissions.tasks import process_uploaded_submission

        paper = self.subject.question_papers.first()
        question = Question.objects.filter(teacher=self.teacher, subject=self.subject.name).first()
        answer_pdf = fitz.open()
        answer_pdf.new_page().insert_text(
            (72, 72),
            "1. Recursion solves a problem by calling the same function on a smaller input.",
        )
        submission = Submission.objects.create(
            subject=self.subject,
            question_paper=paper,
            reference_document=self.subject.reference_documents.first(),
            question=question,
            student=self.student,
            answer_document=SimpleUploadedFile("retry-success.pdf", answer_pdf.tobytes()),
            status=Submission.Status.FAILED,
            processing_error="Temporary provider failure.",
        )

        result = process_uploaded_submission.apply(args=(submission.id, paper.id)).get()

        submission.refresh_from_db()
        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(submission.status, Submission.Status.PENDING_TEACHER_REVIEW)
        self.assertEqual(submission.processing_error, "")
        self.assertTrue(Evaluation.objects.filter(submission=submission).exists())

    def test_authenticated_answer_sheet_download_and_cross_student_isolation(self):
        answer = SimpleUploadedFile(
            "student-answer.txt",
            b"Recursion explanation by enrolled student.",
            content_type="text/plain",
        )
        q = Question.objects.filter(subject=self.subject.name).first()
        if not q:
            q = Question.objects.create(
                teacher=self.teacher,
                subject=self.subject.name,
                title="Q1",
                question_text="Explain recursion",
                max_marks=Decimal("10.00"),
            )
        sub = Submission.objects.create(
            question=q,
            subject=self.subject,
            student=self.student,
            answer_document=answer,
            status=Submission.Status.PUBLISHED,
        )
        download_url = reverse("submissions:submission-answer-sheet-download", kwargs={"submission_id": sub.id})

        # Owner teacher can download
        self.client.force_authenticate(user=self.teacher)
        res_teacher = self.client.get(download_url)
        self.assertEqual(res_teacher.status_code, status.HTTP_200_OK)
        self.assertEqual(res_teacher["X-Frame-Options"], "SAMEORIGIN")

        # Owner student can download after publication
        self.client.force_authenticate(user=self.student)
        res_student = self.client.get(download_url)
        self.assertEqual(res_student.status_code, status.HTTP_200_OK)

        # Cross-student objects are hidden (404)
        self.client.force_authenticate(user=self.non_enrolled_student)
        res_other = self.client.get(download_url)
        self.assertEqual(res_other.status_code, status.HTTP_404_NOT_FOUND)

    def test_pdf_preview_renders_requested_page_and_obeys_publication_access(self):
        import pymupdf as fitz

        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "First answer page")
        pdf.new_page().insert_text((72, 72), "Second answer page")
        question = Question.objects.filter(teacher=self.teacher, subject=self.subject.name).first()
        submission = Submission.objects.create(
            subject=self.subject,
            question=question,
            student=self.student,
            answer_document=SimpleUploadedFile("two-page-answer.pdf", pdf.tobytes(), content_type="application/pdf"),
            status=Submission.Status.PENDING_TEACHER_REVIEW,
        )
        preview_url = reverse(
            "submissions:submission-answer-sheet-preview",
            kwargs={"submission_id": submission.id},
        )

        self.client.force_authenticate(user=self.teacher)
        preview = self.client.get(f"{preview_url}?page=2")
        self.assertEqual(preview.status_code, status.HTTP_200_OK)
        self.assertEqual(preview["Content-Type"], "image/png")
        self.assertEqual(preview["X-Document-Page-Number"], "2")
        self.assertEqual(preview["X-Document-Page-Count"], "2")
        self.assertTrue(preview.content.startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertEqual(self.client.get(f"{preview_url}?page=3").status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get(preview_url).status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.non_enrolled_student)
        self.assertEqual(self.client.get(preview_url).status_code, status.HTTP_404_NOT_FOUND)

        submission.status = Submission.Status.PUBLISHED
        submission.save(update_fields=["status"])
        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get(preview_url).status_code, status.HTTP_200_OK)
