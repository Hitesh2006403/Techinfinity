import mimetypes
from decimal import Decimal
from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, Http404, HttpResponse
from django.utils.http import content_disposition_header
from rest_framework.views import APIView
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from config.responses import api_response
from .models import Submission, UploadedAnswerSheet
from .serializers import SubmissionCreateSerializer, SubmissionSerializer
from .serializers import (
    TeacherAnswerSheetUploadSerializer,
    RawAnswerSheetUploadSerializer,
    MappedAnswerSheetUploadSerializer,
    EadaesMappedAnswerSheetUploadSerializer,
    UnifiedAnswerSheetUploadSerializer,
)
from .permissions import IsStudentToSubmit, CanAccessSubmission
from accounts.permissions import IsTeacher
from questions.models import Enrollment, Question
from evaluations.models import Evaluation
from evaluations.services import EvaluationServiceError, validate_exam_for_grading
from evaluations.reporting import generate_evaluation_report
from rag.services import process_question_paper
from rag.services import process_student_answers
from questions.rag_models import Document, QuestionPaper
from .tasks import process_uploaded_submission
from .state import transition_submission, InvalidStatusTransition


class TeacherAnswerSheetUploadView(APIView):
    """Allow a teacher to attach a student's answer-sheet document to a question."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = TeacherAnswerSheetUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Answer-sheet upload failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        question = serializer.validated_data["question_id"]
        if question.teacher_id != request.user.id:
            return api_response(
                success=False,
                message="You can only upload answer sheets for your own questions.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        submission = Submission.objects.create(
            question=question,
            student=serializer.validated_data["student_id"],
            answer_document=serializer.validated_data["answer_document"],
            answer_text=serializer.validated_data.get("answer_text", "").strip(),
        )
        return api_response(
            success=True,
            message="Student answer sheet uploaded successfully.",
            data={"submission": SubmissionSerializer(submission).data},
            status_code=status.HTTP_201_CREATED,
        )


class RawAnswerSheetUploadView(APIView):
    """Store an answer document without requiring question/student metadata."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request):
        serializer = RawAnswerSheetUploadSerializer(data=request.data)
        if serializer.is_valid():
            subject = serializer.validated_data.get("subject")
            if subject and subject.teacher_id != request.user.id:
                return api_response(
                    success=False,
                    message="You can only upload documents under your own subjects.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            upload = serializer.save(teacher=request.user)
            if upload.document_type == UploadedAnswerSheet.DocumentType.QUESTION_PAPER and subject:
                process_question_paper(subject, upload.document)
            return api_response(
                success=True,
                message="Answer document uploaded successfully.",
                data={"upload": RawAnswerSheetUploadSerializer(upload).data},
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Answer document upload failed.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class MappedAnswerSheetUploadView(APIView):
    """Upload an answer sheet mapped to one teacher subject and one student."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = MappedAnswerSheetUploadSerializer

    def post(self, request, subject_id=None):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Mapped answer-sheet upload failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        subject = serializer.validated_data["subject"]
        if subject_id is not None and subject.id != subject_id:
            return api_response(success=False, message="The uploaded subject does not match this endpoint.", status_code=status.HTTP_400_BAD_REQUEST)
        if subject.teacher_id != request.user.id:
            return api_response(
                success=False,
                message="You can only use subjects that you created.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        student = serializer.validated_data["student"]
        if not Enrollment.objects.filter(subject=subject, student=student).exists():
            return api_response(
                success=False,
                message="This student is not enrolled in this subject. Please enroll them first.",
                errors={"student": "Student is not enrolled in this subject."},
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        reference_document = subject.reference_documents.order_by("-version", "-uploaded_at").first()
        if not reference_document or reference_document.processing_status != "COMPLETED" or not reference_document.chunks.exists():
            canonical_reference = subject.documents.filter(
                kind=Document.Kind.REFERENCE
            ).order_by("-created_at").first()
            failure = (reference_document.processing_error if reference_document else "") or (
                canonical_reference.error if canonical_reference else ""
            )
            if failure:
                message = f"Reference PDF processing failed: {failure}"
            elif canonical_reference or reference_document:
                message = "The subject reference PDF is still processing. Wait for it to finish before uploading student answer sheets."
            else:
                message = "Upload and process a subject reference PDF before uploading student answer sheets."
            return api_response(
                success=False,
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        question_paper_record = subject.question_papers.order_by("-uploaded_at").first()
        if not question_paper_record:
            canonical_question_paper = subject.documents.filter(
                kind=Document.Kind.QUESTION_PAPER
            ).order_by("-created_at").first()
            failure = canonical_question_paper.error if canonical_question_paper else ""
            if failure:
                message = f"Question paper processing failed: {failure}"
            elif canonical_question_paper:
                message = "The question paper is still processing. Wait for extracted questions before uploading student answer sheets."
            else:
                message = "Upload and process a question paper for this subject before uploading answer sheets."
            return api_response(success=False, message=message, status_code=status.HTTP_400_BAD_REQUEST)
        if question_paper_record.processing_status != "COMPLETED":
            if question_paper_record.processing_status == "FAILED":
                detail = question_paper_record.processing_error or "The PDF could not be processed."
                message = f"Question paper processing failed: {detail}"
            else:
                message = "The question paper is still processing. Wait before uploading student answer sheets."
            return api_response(
                success=False,
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        question_paper_record = QuestionPaper.objects.prefetch_related("questions").get(pk=question_paper_record.pk)
        if not question_paper_record.questions.exists():
            return api_response(
                success=False,
                message="The question paper has not produced any extracted questions yet. Wait for processing or retry the paper.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        missing_marks = [item.number for item in question_paper_record.questions.all() if item.maximum_marks is None]
        if missing_marks:
            return api_response(
                success=False,
                message="Add maximum marks for every extracted question before uploading answer sheets.",
                errors={"questions": missing_marks},
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if self.serializer_class is EadaesMappedAnswerSheetUploadSerializer:
            try:
                validate_exam_for_grading(subject, question_paper_record)
            except EvaluationServiceError as exc:
                return api_response(
                    success=False,
                    message="The exam is not ready for EADAES grading.",
                    errors={"detail": str(exc)},
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
        extracted_marks = [item.maximum_marks for item in question_paper_record.questions.all()] if question_paper_record else []
        total_marks = sum(extracted_marks, Decimal("0.00")) if extracted_marks and all(extracted_marks) else Decimal("100.00")
        question, _ = Question.objects.get_or_create(
            teacher=request.user,
            subject=subject.name,
            title=f"{subject.name} examination",
            defaults={
                "question_text": "Evaluate the student's answer against the uploaded exam question paper.",
                "reference_answer": subject.notes_description or "Use the uploaded common subject reference document.",
                "max_marks": total_marks,
                "marking_rubric": subject.notes_description or "Evaluate correctness, completeness, reasoning, and clarity.",
                "is_active": True,
            },
        )
        upload = UploadedAnswerSheet.objects.create(
            teacher=request.user,
            subject=subject,
            student=student,
            document_type=UploadedAnswerSheet.DocumentType.ANSWER_SHEET,
            document=serializer.validated_data["document"],
        )
        submission = Submission.objects.create(
            subject=subject,
            question_paper=question_paper_record,
            reference_document=reference_document,
            question=question,
            student=student,
            answer_document=upload.document.name,
            answer_text="",
        )
        upload.submission = submission
        upload.save(update_fields=["submission"])
        submission.refresh_from_db()
        if not settings.CELERY_TASK_ALWAYS_EAGER:
            try:
                process_uploaded_submission.delay(submission.id, question_paper_record.id)
            except Exception:
                # Redis is optional for a local prototype. Execute the same task
                # synchronously if no broker is available; failures are stored
                # on the submission by the task itself.
                process_uploaded_submission.apply(args=(submission.id, question_paper_record.id))
        else:
            process_uploaded_submission.apply(args=(submission.id, question_paper_record.id))
        submission.refresh_from_db()
        upload.refresh_from_db()
        if submission.status == Submission.Status.FAILED:
            message = "Answer sheet stored, but AI evaluation failed. Review the error and retry."
        elif submission.status == Submission.Status.PENDING_TEACHER_REVIEW:
            message = "AI evaluation completed and is awaiting teacher review."
        else:
            message = "Answer sheet uploaded and queued for AI evaluation."
        return api_response(
            success=True,
            message=message,
            data={
                "upload": RawAnswerSheetUploadSerializer(upload).data,
                "submission": SubmissionSerializer(submission, context={"request": request}).data,
                "task_status": submission.status,
            },
            status_code=status.HTTP_201_CREATED if submission.status in {Submission.Status.PENDING_TEACHER_REVIEW, Submission.Status.FAILED} else status.HTTP_202_ACCEPTED,
        )


class UnifiedAnswerSheetUploadView(MappedAnswerSheetUploadView):
    """Active strict upload path used by the subject workspace UI."""

    serializer_class = UnifiedAnswerSheetUploadSerializer


class RetrySubmissionView(APIView):
    """Re-run extraction and evaluation for a teacher-owned failed attempt."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def post(self, request, submission_id):
        submission = get_object_or_404(
            Submission.objects.select_related("question", "subject", "question_paper"),
            pk=submission_id,
        )
        if not (
            submission.question.teacher_id == request.user.id
            or (submission.subject and submission.subject.teacher_id == request.user.id)
        ):
            return api_response(success=False, message="You cannot retry another teacher's submission.", status_code=status.HTTP_403_FORBIDDEN)
        if submission.status != Submission.Status.FAILED:
            return api_response(success=False, message="Only failed submissions can be retried.", status_code=status.HTTP_409_CONFLICT)
        paper = submission.question_paper
        if paper is None or not submission.answer_document:
            return api_response(success=False, message="The failed attempt is missing its source document or question-paper version.", status_code=status.HTTP_400_BAD_REQUEST)

        existing = getattr(submission, "evaluation", None)
        if existing is not None:
            if existing.report_document:
                existing.report_document.delete(save=False)
            existing.delete()
        submission.extracted_answers.all().delete()
        submission.answer_text = ""
        submission.processing_error = ""
        submission.extraction_metadata = {}
        submission.save(update_fields=["answer_text", "processing_error", "extraction_metadata"])
        try:
            # Queue the retry as UPLOADED; the task atomically claims it and
            # moves it to PROCESSING before extraction begins.
            transition_submission(submission, Submission.Status.UPLOADED)
        except InvalidStatusTransition as exc:
            return api_response(success=False, message=str(exc), status_code=status.HTTP_409_CONFLICT)

        if settings.CELERY_TASK_ALWAYS_EAGER:
            process_uploaded_submission.apply(args=(submission.id, paper.id))
        else:
            try:
                process_uploaded_submission.delay(submission.id, paper.id)
            except Exception:
                process_uploaded_submission.apply(args=(submission.id, paper.id))
        submission.refresh_from_db()
        is_queued = submission.status in {Submission.Status.UPLOADED, Submission.Status.PROCESSING}
        return api_response(
            success=True,
            message="Retry queued." if is_queued else "Retry finished.",
            data={"submission": SubmissionSerializer(submission, context={"request": request}).data},
            status_code=status.HTTP_202_ACCEPTED if is_queued else status.HTTP_200_OK,
        )


class EadaesMappedAnswerSheetUploadView(MappedAnswerSheetUploadView):
    """Strict PDF-only answer-sheet upload for the canonical EADAES workflow."""

    serializer_class = EadaesMappedAnswerSheetUploadSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Answer sheet validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        subject = serializer.validated_data["subject"]
        ready_exam = subject.exams.filter(Q(status="ready") | Q(status="READY")).first() if hasattr(subject, "exams") else None
        if not ready_exam:
            return api_response(
                success=False,
                message="An approved exam and rubrics in READY status are required before evaluation.",
                errors={"detail": "An approved exam in READY status is required before evaluation."},
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return super().post(request)


class SubjectDocumentListView(APIView):
    """List documents uploaded under one teacher-owned subject."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request, subject_id):
        documents = UploadedAnswerSheet.objects.filter(
            teacher=request.user, subject_id=subject_id
        ).select_related("student")
        serializer = RawAnswerSheetUploadSerializer(documents, many=True)
        return api_response(
            success=True,
            message="Subject documents retrieved successfully.",
            data={"documents": serializer.data},
        )


class SubmissionListCreateView(APIView):
    """
    GET /api/submissions/ - List submissions filtered by user role.
    POST /api/submissions/ - Submit answer to a question (Student only).
    """

    permission_classes = [permissions.IsAuthenticated, IsStudentToSubmit]

    def get(self, request):
        user = request.user
        queryset = (
            Submission.objects.select_related(
                "question", "question__teacher", "student"
            )
            .prefetch_related("evaluation")
            .all()
        )

        if getattr(user, "role", None) == "STUDENT" and not (
            user.is_staff or user.is_superuser
        ):
            queryset = queryset.filter(student=user)
        elif getattr(user, "role", None) == "TEACHER" and not (
            user.is_staff or user.is_superuser
        ):
            queryset = queryset.filter(question__teacher=user)

        # Optional filters
        subject_filter = request.query_params.get("subject") or request.query_params.get("subject_id")
        if subject_filter:
            try:
                sub_pk = int(subject_filter)
                queryset = queryset.filter(Q(subject_id=sub_pk) | Q(source_answer_sheet__subject_id=sub_pk))
            except ValueError:
                queryset = queryset.filter(question__subject__iexact=subject_filter.strip())

        question_id = request.query_params.get("question_id")
        if question_id:
            queryset = queryset.filter(question_id=question_id)

        status_filter = request.query_params.get("status")
        if status_filter:
            status_clean = status_filter.strip().lower()
            if status_clean == "needs_attention":
                queryset = queryset.filter(evaluation__needs_attention=True)
            elif status_clean in {"pending_review", "pending_teacher_review"}:
                queryset = queryset.filter(status=Submission.Status.PENDING_TEACHER_REVIEW)
            elif status_clean == "published":
                queryset = queryset.filter(status=Submission.Status.PUBLISHED)
            else:
                queryset = queryset.filter(status__iexact=status_filter.strip())

        serializer = SubmissionSerializer(queryset, many=True, context={"request": request})
        return api_response(
            success=True,
            message="Submissions retrieved successfully.",
            data={"count": queryset.count(), "submissions": serializer.data},
            status_code=status.HTTP_200_OK,
        )

    def post(self, request):
        if getattr(request.user, "role", None) != "STUDENT":
            return api_response(
                success=False,
                message="Only students are authorized to submit answers.",
                errors={"role": "User role must be STUDENT."},
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = SubmissionCreateSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.validated_data["question"]
            if not question.is_active:
                return api_response(
                    success=False,
                    message="This question is currently inactive and not accepting submissions.",
                    errors={"question": "Question is inactive."},
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            submission = serializer.save(student=request.user)
            output = SubmissionSerializer(submission, context={"request": request})
            return api_response(
                success=True,
                message="Answer submitted successfully.",
                data={"submission": output.data},
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Failed to submit answer.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class AnswerSheetDownloadView(APIView):
    """Authenticated endpoint to view or download a student's answer sheet file."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, submission_id):
        user = request.user
        queryset = Submission.objects.select_related("question__teacher", "student", "subject")
        if getattr(user, "role", None) == "STUDENT":
            queryset = queryset.filter(student=user)
        submission = get_object_or_404(queryset, pk=submission_id)
        is_teacher_owner = (
            submission.question.teacher == user
            or (submission.subject and submission.subject.teacher == user)
        )
        is_student_owner = submission.student == user
        if not (is_teacher_owner or is_student_owner or user.is_staff or user.is_superuser):
            return api_response(
                success=False,
                message="You are not authorized to view this answer sheet.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if is_student_owner and not (user.is_staff or user.is_superuser) and submission.status != Submission.Status.PUBLISHED:
            return api_response(
                success=False,
                message="Your answer sheet is available after teacher publication.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if not submission.answer_document:
            raise Http404("No answer sheet file is attached to this submission.")
        mime, _ = mimetypes.guess_type(submission.answer_document.name)
        mime = mime or "application/octet-stream"
        response = FileResponse(submission.answer_document.open("rb"), content_type=mime)
        # The teacher review workspace embeds this authenticated PDF in a
        # same-origin iframe. Keep cross-site framing blocked.
        response["X-Frame-Options"] = "SAMEORIGIN"
        filename = submission.answer_document.name.split("/")[-1]
        response["Content-Disposition"] = content_disposition_header(False, filename)
        return response


class AnswerSheetPreviewView(APIView):
    """Render one authenticated answer-sheet page as a browser-friendly image."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, submission_id):
        user = request.user
        queryset = Submission.objects.select_related("question__teacher", "student", "subject")
        if getattr(user, "role", None) == "STUDENT":
            queryset = queryset.filter(student=user)
        submission = get_object_or_404(queryset, pk=submission_id)
        is_teacher_owner = (
            submission.question.teacher_id == user.id
            or (submission.subject and submission.subject.teacher_id == user.id)
        )
        is_student_owner = submission.student_id == user.id
        if not (is_teacher_owner or is_student_owner or user.is_staff or user.is_superuser):
            return api_response(
                success=False,
                message="You are not authorized to preview this answer sheet.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if is_student_owner and not (user.is_staff or user.is_superuser) and submission.status != Submission.Status.PUBLISHED:
            return api_response(
                success=False,
                message="Your answer sheet is available after teacher publication.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if not submission.answer_document:
            raise Http404("No answer sheet file is attached to this submission.")

        page_number = request.query_params.get("page", "1")
        try:
            page_number = int(page_number)
        except (TypeError, ValueError):
            return api_response(
                success=False,
                message="Page must be a positive integer.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if page_number < 1:
            return api_response(
                success=False,
                message="Page must be a positive integer.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        mime, _ = mimetypes.guess_type(submission.answer_document.name)
        mime = mime or "application/octet-stream"
        if mime == "application/pdf":
            try:
                try:
                    import pymupdf as fitz
                except ImportError:  # pragma: no cover - compatibility with older PyMuPDF installs
                    import fitz
                with submission.answer_document.open("rb") as source:
                    raw = source.read()
                with fitz.open(stream=raw, filetype="pdf") as document:
                    if page_number > document.page_count:
                        return api_response(
                            success=False,
                            message="Requested page is outside this answer sheet.",
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )
                    pixmap = document[page_number - 1].get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
                    response = HttpResponse(pixmap.tobytes("png"), content_type="image/png")
                    page_count = document.page_count
            except Exception:
                return api_response(
                    success=False,
                    message="Could not render this PDF page. Download the original answer sheet to view it.",
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
        else:
            if page_number != 1:
                return api_response(
                    success=False,
                    message="Image answer sheets contain one page.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            response = FileResponse(submission.answer_document.open("rb"), content_type=mime)
            page_count = 1

        response["X-Document-Page-Count"] = str(page_count)
        response["X-Document-Page-Number"] = str(page_number)
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store"
        response["Content-Disposition"] = content_disposition_header(False, f"answer-page-{page_number}")
        return response


class SubmissionDetailView(APIView):
    """
    GET /api/submissions/<id>/ - View submission details.
    """

    permission_classes = [permissions.IsAuthenticated, CanAccessSubmission]

    def get(self, request, pk):
        queryset = Submission.objects.select_related(
                "question", "question__teacher", "student"
            ).prefetch_related("evaluation")
        if getattr(request.user, "role", None) == "STUDENT":
            queryset = queryset.filter(student=request.user)
        submission = get_object_or_404(queryset, pk=pk)
        self.check_object_permissions(request, submission)

        serializer = SubmissionSerializer(submission, context={"request": request})
        return api_response(
            success=True,
            message="Submission details retrieved successfully.",
            data={"submission": serializer.data},
            status_code=status.HTTP_200_OK,
        )
