from decimal import Decimal
from django.http import FileResponse, Http404
from django.utils.http import content_disposition_header
from rest_framework.views import APIView
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from accounts.models import User
from config.responses import api_response
from .models import Enrollment, Exam, Question, SubjectResource
from .rag_models import Document, ExtractedQuestion, QuestionPaper, ReferenceDocument
from .serializers import (
    ExtractedQuestionSerializer,
    QuestionCreateUpdateSerializer,
    QuestionSerializer,
    SubjectResourceSerializer,
    EadaesDocumentUploadSerializer,
    ExamSerializer,
    RubricSerializer,
    CanonicalDocumentStatusSerializer,
    EadaesSubjectCreateSerializer,
    EnrollmentSerializer,
)
from .permissions import IsTeacherOwnerOrReadOnly
from rag.validation import validate_pdf_upload
from rag.services import process_marking_scheme, process_reference_document, process_question_paper, retry_question_paper, retry_reference_document
from rag.services import _canonical_document
from .tasks import process_eadaes_document


class SubjectResourceListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) == "STUDENT":
            resources = SubjectResource.objects.filter(enrollments__student=request.user).distinct()
        else:
            resources = SubjectResource.objects.filter(teacher=request.user)
        return api_response(
            success=True,
            message="Subject resources retrieved successfully.",
            data={"resources": SubjectResourceSerializer(resources, many=True, context={"request": request}).data},
        )

    def post(self, request):
        if getattr(request.user, "role", None) != "TEACHER":
            return api_response(
                success=False,
                message="Only teachers can upload subject resources.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        serializer = SubjectResourceSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            validated = dict(serializer.validated_data)
            qp_file = request.FILES.get("question_paper") or validated.pop("question_paper", None)
            ref_file = request.FILES.get("reference_notes") or validated.get("reference_notes")

            # If files were uploaded, validate as PDFs when coming through unified creation
            if qp_file:
                try:
                    validate_pdf_upload(qp_file)
                except Exception as exc:
                    return api_response(
                        success=False,
                        message="Question paper PDF validation failed.",
                        errors={"question_paper": str(exc)},
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )
            if ref_file:
                try:
                    validate_pdf_upload(ref_file)
                except Exception as exc:
                    return api_response(
                        success=False,
                        message="Reference notes PDF validation failed.",
                        errors={"reference_notes": str(exc)},
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

            resource, _ = SubjectResource.objects.update_or_create(
                teacher=request.user,
                name=validated["name"],
                defaults={
                    "code": validated.get("code", ""),
                    "semester": validated.get("semester", ""),
                    "academic_year": validated.get("academic_year", ""),
                    "notes_description": validated.get("notes_description", ""),
                    "reference_notes": ref_file,
                },
            )
            # Create canonical documents & dispatch eager/async indexing
            if ref_file:
                ref_doc = _canonical_document(resource, Document.Kind.REFERENCE, ref_file)
                try:
                    process_eadaes_document.delay(ref_doc.id)
                except Exception:
                    process_reference_document(resource, ref_file)
            if qp_file:
                qp_doc = _canonical_document(resource, Document.Kind.QUESTION_PAPER, qp_file)
                try:
                    process_eadaes_document.delay(qp_doc.id)
                except Exception:
                    process_question_paper(resource, qp_file)

            return api_response(
                success=True,
                message="Subject resources saved successfully.",
                data={"resource": SubjectResourceSerializer(resource, context={"request": request}).data},
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Subject resource upload failed.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class SubjectPipelineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_subject(self, request, subject_id):
        if getattr(request.user, "role", None) == User.Role.STUDENT:
            return get_object_or_404(
                SubjectResource,
                pk=subject_id,
                enrollments__student=request.user,
            )
        return get_object_or_404(SubjectResource, pk=subject_id, teacher=request.user)

    def get(self, request, subject_id):
        subject = self.get_subject(request, subject_id)
        from .serializers import ReferenceDocumentStatusSerializer, QuestionPaperStatusSerializer
        ref_docs = list(subject.reference_documents.order_by("-uploaded_at"))
        q_papers = list(subject.question_papers.order_by("-uploaded_at").prefetch_related("questions"))
        canonical_docs = list(subject.documents.order_by("-created_at"))

        latest_ref = ref_docs[0] if ref_docs else None
        latest_paper = q_papers[0] if q_papers else None
        latest_canonical_ref = next((d for d in canonical_docs if d.kind == Document.Kind.REFERENCE), None)
        latest_canonical_qp = next((d for d in canonical_docs if d.kind == Document.Kind.QUESTION_PAPER), None)
        has_ref = bool(
            latest_ref and latest_ref.processing_status == "COMPLETED" and latest_ref.chunks.exists()
        )
        has_qp = bool(
            latest_paper and latest_paper.processing_status == "COMPLETED" and latest_paper.questions.exists()
        )
        if latest_canonical_ref and latest_canonical_ref.status != "COMPLETED":
            has_ref = False
        if latest_canonical_qp and latest_canonical_qp.status != "COMPLETED":
            has_qp = False
        has_failed = bool(
            (latest_canonical_ref and latest_canonical_ref.status == "FAILED")
            or (latest_canonical_qp and latest_canonical_qp.status == "FAILED")
            or (latest_ref and latest_ref.processing_status == "FAILED")
            or (latest_paper and latest_paper.processing_status == "FAILED")
        )

        is_ready = bool(has_ref and has_qp)
        pipeline_status = "READY" if is_ready else ("FAILED" if has_failed else "PROCESSING")

        total_pages = sum(d.page_count for d in canonical_docs)
        extracted_questions_count = latest_paper.questions.count() if latest_paper else 0
        reference_chunks_count = latest_ref.chunks.count() if latest_ref else 0

        latest_error = ""
        for d in canonical_docs:
            if d.error:
                latest_error = d.error
                break

        return api_response(
            success=True,
            message="Subject RAG pipeline status retrieved successfully.",
            data={
                "is_ready": is_ready,
                "status": pipeline_status,
                "total_pages": total_pages,
                "extracted_questions_count": extracted_questions_count,
                "reference_chunks_count": reference_chunks_count,
                "latest_error": latest_error,
                "reference_documents": ReferenceDocumentStatusSerializer(
                    ref_docs, many=True
                ).data,
                "question_papers": QuestionPaperStatusSerializer(
                    q_papers, many=True
                ).data,
                "documents": CanonicalDocumentStatusSerializer(
                    canonical_docs, many=True
                ).data,
            },
        )


class EadaesSubjectCreateView(APIView):
    """Create subject metadata before canonical PDF ingestion begins."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "role", None) != "TEACHER":
            return api_response(success=False, message="Only teachers can create subjects.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = EadaesSubjectCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, message="Subject creation failed.", errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        subject, _ = SubjectResource.objects.update_or_create(
            teacher=request.user,
            name=serializer.validated_data["name"],
            defaults={
                "code": serializer.validated_data.get("code", ""),
                "notes_description": serializer.validated_data.get("notes_description", ""),
            },
        )
        return api_response(success=True, message="EADAES subject created.", data={"subject": SubjectResourceSerializer(subject).data}, status_code=status.HTTP_201_CREATED)


class SubjectEnrollmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_subject(self, request, subject_id):
        return get_object_or_404(SubjectResource, pk=subject_id, teacher=request.user)

    def get(self, request, subject_id):
        subject = self.get_subject(request, subject_id)
        return api_response(
            success=True,
            message="Subject enrollments retrieved successfully.",
            data={"enrollments": EnrollmentSerializer(subject.enrollments.select_related("student"), many=True).data},
        )

    def post(self, request, subject_id):
        subject = self.get_subject(request, subject_id)
        student_id = request.data.get("student_id")
        student = get_object_or_404(User, pk=student_id, role=User.Role.STUDENT, is_active=True)
        enrollment, _ = Enrollment.objects.get_or_create(subject=subject, student=student)
        return api_response(
            success=True,
            message="Student enrolled in subject.",
            data={"enrollment": EnrollmentSerializer(enrollment).data},
            status_code=status.HTTP_201_CREATED,
        )

    def delete(self, request, subject_id, student_id=None):
        subject = self.get_subject(request, subject_id)
        target_student_id = student_id or request.data.get("student_id") or request.query_params.get("student_id")
        if not target_student_id:
            return api_response(
                success=False,
                message="student_id is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        enrollment = get_object_or_404(Enrollment, subject=subject, student_id=target_student_id)
        enrollment.delete()
        return api_response(
            success=True,
            message="Student unenrolled from subject.",
            status_code=status.HTTP_200_OK,
        )


class EadaesDocumentUploadView(APIView):
    """Upload one strict-PDF source into a teacher-owned subject pipeline."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, subject_id):
        subject = get_object_or_404(SubjectResource, pk=subject_id, teacher=request.user)
        if getattr(request.user, "role", None) != "TEACHER":
            return api_response(success=False, message="Only teachers can upload EADAES documents.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = EadaesDocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, message="EADAES document upload failed.", errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        kind = serializer.validated_data["kind"]
        document = serializer.validated_data["document"]
        record = _canonical_document(subject, kind, document)
        try:
            task = process_eadaes_document.delay(record.id)
        except Exception as exc:
            record.status = "FAILED"
            record.error = (
                "The document was saved, but the background worker could not be reached. "
                "Start Redis and a Celery worker, then retry this document. "
                f"Details: {exc}"
            )
            record.save(update_fields=["status", "error", "updated_at"])
            return api_response(
                success=False,
                message="Document could not be queued for processing.",
                errors={"detail": record.error},
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        record.refresh_from_db()
        return api_response(
            success=record.status != "FAILED",
            message="EADAES PDF uploaded and queued for background indexing.",
            data={"document_id": record.id, "kind": kind, "status": record.status, "task_id": task.id},
            status_code=status.HTTP_202_ACCEPTED,
        )


class ExamListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        exams = Exam.objects.filter(subject__teacher=request.user).select_related("subject")
        return api_response(success=True, message="Exams retrieved successfully.", data={"exams": ExamSerializer(exams, many=True).data})

    def post(self, request):
        if getattr(request.user, "role", None) != "TEACHER":
            return api_response(success=False, message="Only teachers can create exams.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = ExamSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, message="Exam creation failed.", errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        subject = get_object_or_404(SubjectResource, pk=serializer.validated_data["subject"].id, teacher=request.user)
        exam = Exam.objects.create(subject=subject, **{key: value for key, value in serializer.validated_data.items() if key != "subject"})
        return api_response(success=True, message="Exam created successfully.", data={"exam": ExamSerializer(exam).data}, status_code=status.HTTP_201_CREATED)


class ExamDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_exam(self, request, pk):
        return get_object_or_404(Exam, pk=pk, subject__teacher=request.user)

    def patch(self, request, pk):
        exam = self.get_exam(request, pk)
        serializer = ExamSerializer(exam, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_response(success=False, message="Exam update failed.", errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        if "subject" in serializer.validated_data and serializer.validated_data["subject"].teacher_id != request.user.id:
            return api_response(success=False, message="Exam subject ownership is invalid.", status_code=status.HTTP_403_FORBIDDEN)
        exam = serializer.save()
        return api_response(success=True, message="Exam updated successfully.", data={"exam": ExamSerializer(exam).data})


class QuestionRubricView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_question(self, request, question_id):
        return get_object_or_404(Question, pk=question_id, teacher=request.user)

    def get(self, request, question_id):
        question = self.get_question(request, question_id)
        rubric = getattr(question, "rubric", None)
        if rubric is None:
            return api_response(success=True, message="No rubric has been created.", data={"rubric": None})
        return api_response(success=True, message="Rubric retrieved successfully.", data={"rubric": {"status": rubric.status, "model_answer": rubric.model_answer, "points": [{"id": p.id, "order": p.order, "text": p.text, "marks": p.marks, "keywords": p.keywords} for p in rubric.points.all()]}})

    def put(self, request, question_id):
        from .models import Question
        from evaluations.models import Rubric, RubricPoint
        from django.db import transaction
        from django.utils import timezone
        question = self.get_question(request, question_id)
        serializer = RubricSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, message="Rubric validation failed.", errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
        points = serializer.validated_data["points"]
        total = sum((point["marks"] for point in points), Decimal("0.00"))
        if total != question.max_marks:
            return api_response(success=False, message="Rubric points must total the question maximum marks.", errors={"points": f"Total is {total}; expected {question.max_marks}."}, status_code=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            rubric, _ = Rubric.objects.get_or_create(question=question)
            rubric.model_answer = serializer.validated_data.get("model_answer", "")
            rubric.status = Rubric.Status.APPROVED
            rubric.approved_by = request.user
            rubric.approved_at = timezone.now()
            rubric.save()
            rubric.points.all().delete()
            RubricPoint.objects.bulk_create([RubricPoint(rubric=rubric, **point) for point in points])
        return api_response(success=True, message="Rubric approved successfully.", data={"rubric": {"status": rubric.status, "question_id": question.id, "total_marks": total}})


class ExtractedQuestionUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        extracted = get_object_or_404(
            ExtractedQuestion.objects.select_related("question_paper__subject"),
            pk=pk,
            question_paper__subject__teacher=request.user,
        )
        serializer = ExtractedQuestionSerializer(extracted, data=request.data, partial=True)
        if serializer.is_valid():
            extracted = serializer.save()
            subject = extracted.question_paper.subject
            # Sync corresponding Question model
            q = Question.objects.filter(
                teacher=subject.teacher,
                subject=subject.name,
                title=f"{subject.name} {extracted.number}",
            ).first()
            if q:
                if extracted.maximum_marks is not None:
                    q.max_marks = extracted.maximum_marks
                if extracted.text:
                    q.question_text = extracted.text
                q.save(update_fields=["max_marks", "question_text", "updated_at"])

            # Sync Exam total marks
            paper = extracted.question_paper
            total_marks = sum(
                (item.maximum_marks for item in paper.questions.all() if item.maximum_marks is not None),
                Decimal("0.00"),
            )
            exam = getattr(q, "exam", None) or subject.exams.first()
            if exam and total_marks > 0:
                exam.total_marks = total_marks
                exam.save(update_fields=["total_marks", "updated_at"])

            return api_response(
                success=True,
                message="Extracted question corrected successfully.",
                data={"question": serializer.data, "total_marks": total_marks},
            )
        return api_response(
            success=False,
            message="Extracted question correction failed.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class QuestionPaperDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, subject_id):
        user = request.user
        if getattr(user, "role", None) == User.Role.STUDENT:
            subject = get_object_or_404(SubjectResource, pk=subject_id)
            if not subject.enrollments.filter(student=user).exists():
                raise Http404
        else:
            subject = get_object_or_404(SubjectResource, pk=subject_id, teacher=user)
        paper = subject.question_papers.filter(processing_status="COMPLETED").order_by("-uploaded_at").first()
        file_to_serve = None
        if paper and paper.document:
            file_to_serve = paper.document
        else:
            doc = subject.documents.filter(kind=Document.Kind.QUESTION_PAPER).order_by("-created_at").first()
            if doc and doc.file:
                file_to_serve = doc.file
        if not file_to_serve:
            raise Http404("Question paper document not found.")
        response = FileResponse(file_to_serve.open("rb"), content_type="application/pdf")
        filename = file_to_serve.name.split("/")[-1]
        response["Content-Disposition"] = content_disposition_header(False, filename)
        return response


class ReferenceDocumentDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, subject_id):
        user = request.user
        if getattr(user, "role", None) == User.Role.STUDENT:
            subject = get_object_or_404(SubjectResource, pk=subject_id)
            if not subject.enrollments.filter(student=user).exists():
                raise Http404
        else:
            subject = get_object_or_404(SubjectResource, pk=subject_id, teacher=user)
        ref = subject.reference_documents.filter(processing_status="COMPLETED").order_by("-uploaded_at").first()
        file_to_serve = None
        if ref and ref.document:
            file_to_serve = ref.document
        elif subject.reference_notes:
            file_to_serve = subject.reference_notes
        if not file_to_serve:
            raise Http404("Reference document not found.")
        mime = "application/pdf" if file_to_serve.name.lower().endswith(".pdf") else "text/plain"
        response = FileResponse(file_to_serve.open("rb"), content_type=mime)
        response["Content-Disposition"] = content_disposition_header(False, file_to_serve.name.split("/")[-1])
        return response


class SubjectDocumentReplaceView(APIView):
    """Replace question paper or reference PDF for an existing subject."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, subject_id):
        if getattr(request.user, "role", None) != "TEACHER":
            return api_response(
                success=False,
                message="Only teachers can replace subject documents.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        subject = get_object_or_404(SubjectResource, pk=subject_id, teacher=request.user)
        kind_value = request.data.get("kind", "")
        kind = kind_value.strip().lower() if isinstance(kind_value, str) else ""
        file_obj = request.FILES.get("document") or request.FILES.get("file")
        if kind not in {Document.Kind.QUESTION_PAPER, Document.Kind.REFERENCE} or not file_obj:
            return api_response(
                success=False,
                message="A valid document kind and PDF are required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_pdf_upload(file_obj)
        except Exception as exc:
            return api_response(
                success=False,
                message="File validation failed.",
                errors={"document": str(exc)},
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        record = _canonical_document(subject, kind, file_obj)
        try:
            process_eadaes_document.delay(record.id)
        except Exception:
            if kind == Document.Kind.REFERENCE:
                process_reference_document(subject, file_obj)
            else:
                process_question_paper(subject, file_obj)
        return api_response(
            success=True,
            message=f"{kind.replace('_', ' ').capitalize()} uploaded and queued for processing.",
            data={"document_id": record.id, "kind": kind, "status": record.status},
            status_code=status.HTTP_202_ACCEPTED,
        )


class ReferenceDocumentRetryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        document = get_object_or_404(
            ReferenceDocument,
            pk=pk,
            subject__teacher=request.user,
        )
        retry_reference_document(document)
        return api_response(
            success=document.processing_status != "FAILED",
            message="Reference document processing retried.",
            data={"processing_status": document.processing_status, "processing_error": document.processing_error},
            status_code=status.HTTP_200_OK,
        )


class QuestionPaperRetryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        paper = get_object_or_404(
            QuestionPaper,
            pk=pk,
            subject__teacher=request.user,
        )
        retry_question_paper(paper)
        return api_response(
            success=paper.processing_status != "FAILED",
            message="Question paper processing retried.",
            data={"processing_status": paper.processing_status, "processing_error": paper.processing_error},
            status_code=status.HTTP_200_OK,
        )


class QuestionListCreateView(APIView):
    """
    GET /api/questions/ - List active questions for students, or teacher's questions.
    POST /api/questions/ - Create a new question (Teacher only).
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerOrReadOnly]

    def get(self, request):
        user = request.user
        queryset = Question.objects.select_related("teacher").all()

        # Filtering logic based on role
        if getattr(user, "role", None) == "TEACHER" and not (
            user.is_staff or user.is_superuser
        ):
            # Questions authored by another teacher are private to that teacher.
            queryset = queryset.filter(teacher=user)
        elif getattr(user, "role", None) == "STUDENT":
            # Students only see active questions open for submissions
            queryset = queryset.filter(is_active=True)

        # Subject query filter
        subject_filter = request.query_params.get("subject")
        if subject_filter:
            queryset = queryset.filter(subject__iexact=subject_filter.strip())

        serializer = QuestionSerializer(
            queryset, many=True, context={"request": request}
        )
        return api_response(
            success=True,
            message="Questions retrieved successfully.",
            data={"count": queryset.count(), "questions": serializer.data},
            status_code=status.HTTP_200_OK,
        )

    def post(self, request):
        if getattr(request.user, "role", None) != "TEACHER":
            return api_response(
                success=False,
                message="Only teachers are authorized to create questions.",
                errors={"role": "User role must be TEACHER."},
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = QuestionCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.save(teacher=request.user)
            output_serializer = QuestionSerializer(
                question, context={"request": request}
            )
            return api_response(
                success=True,
                message="Question created successfully.",
                data={"question": output_serializer.data},
                status_code=status.HTTP_201_CREATED,
            )
        return api_response(
            success=False,
            message="Failed to create question. Please check input parameters.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class QuestionDetailView(APIView):
    """
    GET /api/questions/<id>/ - View question details.
    PUT /api/questions/<id>/ - Update entire question (Teacher owner only).
    PATCH /api/questions/<id>/ - Partial update question (Teacher owner only).
    DELETE /api/questions/<id>/ - Delete question (Teacher owner only).
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOwnerOrReadOnly]

    def get_object(self, pk, request):
        question = get_object_or_404(
            Question.objects.select_related("teacher"), pk=pk
        )
        self.check_object_permissions(request, question)
        return question

    def get(self, request, pk):
        question = self.get_object(pk, request)
        serializer = QuestionSerializer(question, context={"request": request})
        return api_response(
            success=True,
            message="Question details retrieved successfully.",
            data={"question": serializer.data},
            status_code=status.HTTP_200_OK,
        )

    def put(self, request, pk):
        question = self.get_object(pk, request)
        serializer = QuestionCreateUpdateSerializer(question, data=request.data)
        if serializer.is_valid():
            updated_question = serializer.save()
            output = QuestionSerializer(
                updated_question, context={"request": request}
            )
            return api_response(
                success=True,
                message="Question updated successfully.",
                data={"question": output.data},
                status_code=status.HTTP_200_OK,
            )
        return api_response(
            success=False,
            message="Failed to update question.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):
        question = self.get_object(pk, request)
        serializer = QuestionCreateUpdateSerializer(
            question, data=request.data, partial=True
        )
        if serializer.is_valid():
            updated_question = serializer.save()
            output = QuestionSerializer(
                updated_question, context={"request": request}
            )
            return api_response(
                success=True,
                message="Question updated partially.",
                data={"question": output.data},
                status_code=status.HTTP_200_OK,
            )
        return api_response(
            success=False,
            message="Failed to update question.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        question = self.get_object(pk, request)
        question_id = question.id
        question.delete()
        return api_response(
            success=True,
            message=f"Question #{question_id} deleted successfully.",
            data={"id": question_id},
            status_code=status.HTTP_200_OK,
        )
