from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.contrib.auth import get_user_model
from unittest.mock import patch
from questions.models import Question, SubjectResource
from questions.rag_models import Document, QuestionPaper, ReferenceChunk, ReferenceDocument
from submissions.models import UploadedAnswerSheet
from submissions.models import Submission
from evaluations.models import Evaluation
from rag.services import process_question_paper, process_reference_document, retrieve_reference_chunks

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


class SubjectRAGPipelineTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="rag_teacher",
            email="rag_teacher@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.other_teacher = User.objects.create_user(
            username="other_rag_teacher",
            email="other_rag_teacher@evalai.com",
            password="Password123!",
            role="TEACHER",
        )
        self.student = User.objects.create_user(
            username="rag_student",
            email="rag_student@evalai.com",
            password="Password123!",
            role="STUDENT",
        )
        self.subject = SubjectResource.objects.create(
            teacher=self.teacher,
            name="RAG Mathematics",
            notes_description="Use definitions, method, working, and final answer.",
        )

    def test_reference_upload_creates_one_common_processed_document(self):
        self.client.force_authenticate(user=self.teacher)
        import pymupdf as fitz
        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "Algebra reference notes. Show the method and justify each step.")
        upload = SimpleUploadedFile(
            "reference.pdf",
            pdf.tobytes(),
            content_type="application/pdf",
        )
        response = self.client.post(
            reverse("questions:subject-resource-list-create"),
            {"name": self.subject.name, "reference_notes": upload},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReferenceDocument.objects.filter(subject=self.subject).count(), 1)
        document = ReferenceDocument.objects.get(subject=self.subject)
        self.assertEqual(document.processing_status, "COMPLETED")
        self.assertGreater(document.chunks.count(), 0)

    def test_pdf_reference_is_extracted_and_retrieved(self):
        import pymupdf as fitz

        pdf = fitz.open()
        page = pdf.new_page()
        page.insert_text((72, 72), "Software engineering requirements describe what a system must do.")
        uploaded = SimpleUploadedFile("reference.pdf", pdf.tobytes(), content_type="application/pdf")

        document = process_reference_document(self.subject, uploaded)

        self.assertEqual(document.processing_status, "COMPLETED")
        self.assertIn("Software engineering requirements", document.extracted_text)
        matches = retrieve_reference_chunks(self.subject, "What must a system do?")
        self.assertTrue(matches)
        self.assertIn("system must do", matches[0].text)

    def test_retrieval_ranks_question_relevant_passage_above_generic_overlap(self):
        import pymupdf as fitz

        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "Project reference material for risk analysis.")
        document = process_reference_document(
            self.subject,
            SimpleUploadedFile("risk-reference.pdf", pdf.tobytes(), content_type="application/pdf"),
        )
        generic_chunk = document.chunks.first()
        generic_chunk.text = "Project planning covers many activities, teams, project controls, and management work."
        generic_chunk.save(update_fields=["text"])
        relevant_chunk = ReferenceChunk.objects.create(
            document=document,
            chunk_index=1,
            text=(
                "Risk analysis evaluates each project threat by estimating its probability and impact. "
                "A probability impact matrix prioritizes the risks and helps choose mitigation responses."
            ),
            page_number=2,
        )

        matches = retrieve_reference_chunks(
            self.subject,
            "How should project risks be assessed using probability and impact analysis?",
            limit=2,
            reference_document=document,
        )

        self.assertEqual(matches[0].id, relevant_chunk.id)

    @override_settings(EVAL_LLM_MOCK=False)
    @patch.dict("os.environ", {"GROQ_API_KEY": ""})
    def test_scanned_reference_without_provider_key_reports_requirement(self):
        import pymupdf as fitz

        pdf = fitz.open()
        pdf.new_page()
        uploaded = SimpleUploadedFile("scanned-reference.pdf", pdf.tobytes(), content_type="application/pdf")

        document = process_reference_document(self.subject, uploaded)

        self.assertEqual(document.processing_status, "FAILED")
        self.assertIn("GROQ_API_KEY", document.processing_error)

    @override_settings(EVAL_LLM_MOCK=True)
    def test_reference_scan_requires_real_vision_mode(self):
        import pymupdf as fitz

        pdf = fitz.open()
        pdf.new_page()
        uploaded = SimpleUploadedFile("scanned-reference.pdf", pdf.tobytes(), content_type="application/pdf")

        document = process_reference_document(self.subject, uploaded)

        self.assertEqual(document.processing_status, "FAILED")
        self.assertIn("Mock mode cannot OCR PDFs", document.processing_error)
        self.assertEqual(document.chunks.count(), 0)
        canonical = Document.objects.get(subject=self.subject, kind=Document.Kind.REFERENCE)
        self.assertEqual(canonical.status, "FAILED")
        self.assertIn("Mock mode cannot OCR PDFs", canonical.error)

    @override_settings(EVAL_LLM_MOCK=True)
    def test_question_paper_scan_requires_real_vision_mode(self):
        import pymupdf as fitz

        pdf = fitz.open()
        pdf.new_page()
        uploaded = SimpleUploadedFile("scanned-paper.pdf", pdf.tobytes(), content_type="application/pdf")

        paper = process_question_paper(self.subject, uploaded)

        self.assertEqual(paper.processing_status, "FAILED")
        self.assertIn("Mock mode cannot OCR PDFs", paper.processing_error)
        canonical = Document.objects.get(subject=self.subject, kind=Document.Kind.QUESTION_PAPER)
        self.assertEqual(canonical.status, "FAILED")
        self.assertIn("Mock mode cannot OCR PDFs", canonical.error)

    @override_settings(EVAL_LLM_MOCK=False, GROQ_VISION_BATCH_SIZE=8, GROQ_VISION_MAX_TOKENS=2800)
    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("rag.services.chat")
    def test_scanned_reference_is_ocr_transcribed_in_supported_batches(self, mock_chat):
        import json
        import pymupdf as fitz

        def transcribe(_prompt, file_parts, json_mode=True, max_tokens=None):
            page_numbers = [part["page_no"] for part in file_parts]
            self.assertTrue(json_mode)
            self.assertEqual(max_tokens, 2800)
            self.assertLessEqual(len(file_parts), 3)
            return json.dumps({
                "pages": [
                    {"page_number": number, "text": f"Project risk reference details for page {number}."}
                    for number in page_numbers
                ]
            })

        mock_chat.side_effect = transcribe
        pdf = fitz.open()
        for _ in range(7):
            pdf.new_page()
        uploaded = SimpleUploadedFile("scanned-reference.pdf", pdf.tobytes(), content_type="application/pdf")

        document = process_reference_document(self.subject, uploaded)

        self.assertEqual(document.processing_status, "COMPLETED")
        self.assertEqual(mock_chat.call_count, 3)
        self.assertIn("Project risk reference details for page 7", document.extracted_text)
        self.assertEqual(document.chunks.count(), 7)

    @override_settings(EVAL_LLM_MOCK=False)
    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"})
    @patch("rag.services.chat")
    def test_scanned_question_paper_ocr_produces_extracted_questions(self, mock_chat):
        import json
        import pymupdf as fitz

        mock_chat.return_value = json.dumps({
            "pages": [{
                "page_number": 1,
                "text": "Question Paper\n1. Explain the project risk response process. (5 marks)",
            }]
        })
        pdf = fitz.open()
        pdf.new_page()
        uploaded = SimpleUploadedFile("scanned-question-paper.pdf", pdf.tobytes(), content_type="application/pdf")

        paper = process_question_paper(self.subject, uploaded)

        self.assertEqual(paper.processing_status, "COMPLETED")
        self.assertEqual(paper.questions.count(), 1)
        self.assertEqual(paper.questions.first().maximum_marks, Decimal("5.00"))
        self.assertIn("Explain the project risk response process", paper.extracted_text)

    def test_question_paper_without_numbered_questions_fails_instead_of_becoming_ready(self):
        import pymupdf as fitz

        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "Course overview and examination instructions only.")
        uploaded = SimpleUploadedFile("instructions.pdf", pdf.tobytes(), content_type="application/pdf")

        paper = process_question_paper(self.subject, uploaded)

        self.assertEqual(paper.processing_status, "FAILED")
        self.assertIn("No numbered questions", paper.processing_error)
        canonical = Document.objects.get(subject=self.subject, kind=Document.Kind.QUESTION_PAPER)
        self.assertEqual(canonical.status, "FAILED")

    def test_pipeline_is_private_to_subject_owner(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.get(
            reverse("questions:subject-pipeline", kwargs={"subject_id": self.subject.id})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reference_retry_is_owner_protected(self):
        document = ReferenceDocument.objects.create(
            subject=self.subject,
            document=SimpleUploadedFile("reference.txt", b"retryable reference"),
            processing_status="FAILED",
            processing_error="temporary failure",
        )
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.post(
            reverse("questions:reference-document-retry", kwargs={"pk": document.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_question_paper_upload_creates_rag_record(self):
        self.client.force_authenticate(user=self.teacher)
        upload = SimpleUploadedFile(
            "paper.txt",
            b"1. Explain vectors (10 marks)\n2. Explain matrices (10 marks)",
            content_type="text/plain",
        )
        response = self.client.post(
            reverse("submissions:raw-answer-sheet-upload"),
            {
                "document_type": "QUESTION_PAPER",
                "subject": self.subject.id,
                "document": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        paper = QuestionPaper.objects.get(subject=self.subject)
        self.assertEqual(paper.processing_status, "COMPLETED")
        self.assertEqual(paper.questions.count(), 2)

    def test_section_heading_marks_are_inferred(self):
        self.client.force_authenticate(user=self.teacher)
        upload = SimpleUploadedFile(
            "sectioned-paper.txt",
            b"SECTION A (2 x 2 = 4 marks)\n1. Define a term.\n2. State one use.\nSECTION B (1 x 6 = 6 marks)\n3. Explain the method.",
            content_type="text/plain",
        )
        response = self.client.post(
            reverse("submissions:raw-answer-sheet-upload"),
            {"document_type": "QUESTION_PAPER", "subject": self.subject.id, "document": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        paper = QuestionPaper.objects.filter(subject=self.subject).order_by("-uploaded_at").first()
        self.assertEqual(list(paper.questions.values_list("maximum_marks", flat=True)), [Decimal("2.00"), Decimal("2.00"), Decimal("6.00")])

    def test_eadaes_document_endpoint_requires_pdf_and_indexes_reference(self):
        self.client.force_authenticate(user=self.teacher)
        url = reverse("questions:eadaes-document-upload", kwargs={"subject_id": self.subject.id})
        rejected = self.client.post(
            url,
            {"kind": Document.Kind.REFERENCE, "document": SimpleUploadedFile("notes.txt", b"not a PDF")},
            format="multipart",
        )
        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)

        import pymupdf as fitz
        pdf = fitz.open()
        page = pdf.new_page()
        page.insert_text((72, 72), "Requirements engineering defines system needs.")
        accepted = self.client.post(
            url,
            {"kind": Document.Kind.REFERENCE, "document": SimpleUploadedFile("notes.pdf", pdf.tobytes(), content_type="application/pdf")},
            format="multipart",
        )
        self.assertEqual(accepted.status_code, status.HTTP_202_ACCEPTED)
        canonical = Document.objects.get(subject=self.subject, kind=Document.Kind.REFERENCE)
        self.assertEqual(canonical.status, "COMPLETED")
        self.assertGreater(canonical.pages.count(), 0)
        self.assertGreater(canonical.chunks.count(), 0)

        invalid = self.client.post(
            url,
            {"kind": Document.Kind.REFERENCE, "document": SimpleUploadedFile("fake.pdf", b"plain text")},
            format="multipart",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eadaes_question_paper_creates_exam_questions_via_task(self):
        self.client.force_authenticate(user=self.teacher)
        import pymupdf as fitz
        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "1. Explain requirements engineering (5 marks)")
        response = self.client.post(
            reverse("questions:eadaes-document-upload", kwargs={"subject_id": self.subject.id}),
            {"kind": Document.Kind.QUESTION_PAPER, "document": SimpleUploadedFile("midterm.pdf", pdf.tobytes(), content_type="application/pdf")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        exam = self.subject.exams.get()
        self.assertEqual(exam.status, "draft")
        question = Question.objects.get(exam=exam)
        self.assertEqual(question.max_marks, Decimal("5.00"))
        self.assertTrue(UploadedAnswerSheet.objects.filter(subject=self.subject, document_type="QUESTION_PAPER").exists())

    def test_eadaes_subject_creation_queues_reference_pdf_separately(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("questions:eadaes-subject-create"),
            {"name": "Queued Reference Subject", "notes_description": "Use the approved notes."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        subject_id = response.data["data"]["subject"]["id"]
        import pymupdf as fitz
        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "Queued reference concepts.")
        upload = self.client.post(
            reverse("questions:eadaes-document-upload", kwargs={"subject_id": subject_id}),
            {"kind": Document.Kind.REFERENCE, "document": SimpleUploadedFile("queued-reference.pdf", pdf.tobytes(), content_type="application/pdf")},
            format="multipart",
        )
        self.assertEqual(upload.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(Document.objects.get(subject_id=subject_id).status, "COMPLETED")

    def test_unified_subject_creation_with_both_pdfs(self):
        self.client.force_authenticate(user=self.teacher)
        import pymupdf as fitz
        qp_pdf = fitz.open()
        qp_pdf.new_page().insert_text((72, 72), "1. Define operating systems (5 marks)")
        ref_pdf = fitz.open()
        ref_pdf.new_page().insert_text((72, 72), "Operating systems manage hardware and software resources.")

        response = self.client.post(
            reverse("questions:subject-resource-list-create"),
            {
                "name": "Distributed Systems",
                "code": "CS-502",
                "semester": "Semester 6",
                "academic_year": "2026-2027",
                "notes_description": "Distributed systems core curriculum",
                "question_paper": SimpleUploadedFile("ds_qp.pdf", qp_pdf.tobytes(), content_type="application/pdf"),
                "reference_notes": SimpleUploadedFile("ds_ref.pdf", ref_pdf.tobytes(), content_type="application/pdf"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        subject_id = response.data["data"]["resource"]["id"]
        sub = SubjectResource.objects.get(id=subject_id)
        self.assertEqual(sub.code, "CS-502")
        self.assertEqual(sub.semester, "Semester 6")
        self.assertEqual(sub.academic_year, "2026-2027")

    def test_enrollment_and_unenrollment_flow(self):
        self.client.force_authenticate(user=self.teacher)
        enroll_url = reverse("questions:subject-enrollments", kwargs={"subject_id": self.subject.id})
        # Enroll
        res = self.client.post(enroll_url, {"student_id": self.student.id}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(self.subject.enrollments.filter(student=self.student).exists())

        # Unenroll
        unenroll_url = reverse("questions:subject-enrollment-detail", kwargs={"subject_id": self.subject.id, "student_id": self.student.id})
        res_del = self.client.delete(unenroll_url)
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        self.assertFalse(self.subject.enrollments.filter(student=self.student).exists())

    def test_authenticated_document_download_and_permissions(self):
        import pymupdf as fitz
        qp_pdf = fitz.open()
        qp_pdf.new_page().insert_text((72, 72), "Exam Question Paper Content")
        qp_doc = SimpleUploadedFile("sample_qp.pdf", qp_pdf.tobytes(), content_type="application/pdf")
        Document.objects.create(
            subject=self.subject,
            uploaded_by=self.teacher,
            kind=Document.Kind.QUESTION_PAPER,
            file=qp_doc,
            status="COMPLETED",
        )

        qp_download_url = reverse("questions:subject-question-paper-download", kwargs={"subject_id": self.subject.id})

        # Owner teacher can download
        self.client.force_authenticate(user=self.teacher)
        res_t = self.client.get(qp_download_url)
        self.assertEqual(res_t.status_code, status.HTTP_200_OK)

        # Non-enrolled student is forbidden (403)
        self.client.force_authenticate(user=self.student)
        res_un = self.client.get(qp_download_url)
        self.assertEqual(res_un.status_code, status.HTTP_404_NOT_FOUND)

        # Enrolled student can download
        from questions.models import Enrollment
        Enrollment.objects.create(subject=self.subject, student=self.student)
        res_en = self.client.get(qp_download_url)
        self.assertEqual(res_en.status_code, status.HTTP_200_OK)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_replacing_subject_documents_keeps_existing_attempt_versions_and_marks(self):
        import pymupdf as fitz

        def pdf_with(text):
            pdf = fitz.open()
            pdf.new_page().insert_text((72, 72), text)
            return pdf.tobytes()

        reference_v1 = process_reference_document(
            self.subject,
            SimpleUploadedFile("reference-v1.pdf", pdf_with("Version one reference concept.")),
        )
        paper_v1 = process_question_paper(
            self.subject,
            SimpleUploadedFile("paper-v1.pdf", pdf_with("1. Explain concept (5 marks).")),
        )
        legacy_question = Question.objects.create(
            teacher=self.teacher,
            subject=self.subject.name,
            title="Versioned exam",
            question_text="Explain concept.",
            reference_answer="Version one reference concept.",
            max_marks=Decimal("5.00"),
        )
        submission = Submission.objects.create(
            subject=self.subject,
            question=legacy_question,
            student=self.student,
            question_paper=paper_v1,
            reference_document=reference_v1,
            answer_text="The original answer.",
        )
        evaluation = Evaluation.objects.create(
            submission=submission,
            suggested_marks=Decimal("4.00"),
            max_marks=Decimal("5.00"),
            feedback="Original evaluation.",
        )

        self.client.force_authenticate(user=self.teacher)
        replace_url = reverse(
            "questions:subject-document-replace",
            kwargs={"subject_id": self.subject.id},
        )
        reference_response = self.client.post(
            replace_url,
            {
                "kind": Document.Kind.REFERENCE,
                "document": SimpleUploadedFile(
                    "reference-v2.pdf", pdf_with("Version two reference concept."), content_type="application/pdf"
                ),
            },
            format="multipart",
        )
        self.assertEqual(reference_response.status_code, status.HTTP_202_ACCEPTED)
        reference_v2 = self.subject.reference_documents.order_by("-version").first()

        paper_response = self.client.post(
            replace_url,
            {
                "kind": Document.Kind.QUESTION_PAPER,
                "document": SimpleUploadedFile(
                    "paper-v2.pdf", pdf_with("1. Explain a revised concept (5 marks)."), content_type="application/pdf"
                ),
            },
            format="multipart",
        )
        self.assertEqual(paper_response.status_code, status.HTTP_202_ACCEPTED)
        paper_v2 = self.subject.question_papers.order_by("-uploaded_at").first()

        self.assertNotEqual(paper_v1.pk, paper_v2.pk)
        self.assertEqual(reference_v1.version, 1)
        self.assertEqual(reference_v2.version, 2)
        submission.refresh_from_db()
        evaluation.refresh_from_db()
        self.assertEqual(submission.question_paper_id, paper_v1.pk)
        self.assertEqual(submission.reference_document_id, reference_v1.pk)
        self.assertEqual(evaluation.suggested_marks, Decimal("4.00"))
