from rest_framework import serializers
from .models import Enrollment, Exam, Question, SubjectResource
from .rag_models import Document, ExtractedQuestion, QuestionPaper, ReferenceDocument
from rag.validation import validate_document_upload, validate_pdf_upload


class SubjectResourceSerializer(serializers.ModelSerializer):
    reference_notes = serializers.FileField(required=False, allow_null=True, write_only=True)
    evaluation_scheme = serializers.FileField(required=False, allow_null=True, write_only=True)
    question_paper = serializers.FileField(required=False, write_only=True)
    enrolled_count = serializers.SerializerMethodField(read_only=True)
    question_paper_url = serializers.SerializerMethodField(read_only=True)
    reference_material_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SubjectResource
        fields = [
            "id", "name", "code", "semester", "academic_year", "reference_notes", "evaluation_scheme",
            "notes_description", "created_at", "updated_at", "enrolled_count",
            "question_paper", "question_paper_url", "reference_material_url",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "enrolled_count", "question_paper_url", "reference_material_url"]

    def get_enrolled_count(self, obj) -> int:
        return obj.enrollments.count()

    def get_question_paper_url(self, obj):
        paper = obj.question_papers.filter(processing_status="COMPLETED").order_by("-uploaded_at").first()
        if paper and paper.document:
            return f"/api/questions/subjects/{obj.id}/question-paper/download/"
        return None

    def get_reference_material_url(self, obj):
        ref = obj.reference_documents.filter(processing_status="COMPLETED").order_by("-uploaded_at").first()
        if ref and ref.document:
            return f"/api/questions/subjects/{obj.id}/reference-material/download/"
        if obj.reference_notes:
            return f"/api/questions/subjects/{obj.id}/reference-material/download/"
        return None

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Subject name is required.")
        return value

    def validate_reference_notes(self, value):
        return validate_document_upload(value)

    def validate_evaluation_scheme(self, value):
        return validate_document_upload(value)

    def validate_question_paper(self, value):
        return validate_document_upload(value)


class EadaesSubjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    code = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    notes_description = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Subject name is required.")
        return value


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField(read_only=True)
    student_username = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "student_name", "student_username", "enrolled_at"]
        read_only_fields = ["id", "student_name", "student_username", "enrolled_at"]

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username


class EadaesDocumentUploadSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=Document.Kind.choices)
    document = serializers.FileField()

    def validate_document(self, value):
        return validate_pdf_upload(value)


class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ["id", "subject", "name", "total_marks", "strictness", "answer_convention_text", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_total_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError("Exam total marks must be greater than zero.")
        return value

    def validate_status(self, value):
        if value == Exam.Status.READY and self.instance is None:
            raise serializers.ValidationError("Create the exam as DRAFT, add questions and approve rubrics, then mark it READY.")
        if value == Exam.Status.READY and self.instance is not None:
            from decimal import Decimal
            from evaluations.models import Rubric

            questions = list(self.instance.questions.all())
            if not questions:
                raise serializers.ValidationError("Add and review extracted questions before marking the exam ready.")
            incomplete = []
            for question in questions:
                rubric = Rubric.objects.filter(question=question, status=Rubric.Status.APPROVED).prefetch_related("points").first()
                total = sum((point.marks for point in rubric.points.all()), Decimal("0.00")) if rubric else Decimal("0.00")
                if rubric is None or total != question.max_marks:
                    incomplete.append(question.title)
            if incomplete:
                raise serializers.ValidationError({"rubric": f"Approve exact-total rubrics before READY: {', '.join(incomplete)}"})
        return value


class RubricPointSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    order = serializers.IntegerField(required=False, min_value=0, default=0)
    text = serializers.CharField()
    marks = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0)
    keywords = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class RubricSerializer(serializers.Serializer):
    status = serializers.CharField(read_only=True)
    model_answer = serializers.CharField(required=False, allow_blank=True, default="")
    points = RubricPointSerializer(many=True)


class ExtractedQuestionSerializer(serializers.ModelSerializer):
    question_id = serializers.SerializerMethodField()
    exam_id = serializers.SerializerMethodField()
    exam_status = serializers.SerializerMethodField()

    class Meta:
        model = ExtractedQuestion
        fields = ["id", "question_id", "exam_id", "exam_status", "number", "text", "maximum_marks", "page_number"]
        read_only_fields = ["id", "page_number"]

    def get_question_id(self, obj):
        question = self._question(obj)
        return question.id if question else None

    def _question(self, obj):
        return Question.objects.filter(
            teacher=obj.question_paper.subject.teacher,
            subject=obj.question_paper.subject.name,
            title=f"{obj.question_paper.subject.name} {obj.number}",
        ).first()

    def get_exam_id(self, obj):
        question = self._question(obj)
        return question.exam_id if question else None

    def get_exam_status(self, obj):
        question = self._question(obj)
        return question.exam.status if question and question.exam_id else None


class ReferenceDocumentStatusSerializer(serializers.ModelSerializer):
    document = serializers.FileField(write_only=True)

    class Meta:
        model = ReferenceDocument
        fields = ["id", "document", "processing_status", "processing_error", "version", "uploaded_at"]


class QuestionPaperStatusSerializer(serializers.ModelSerializer):
    document = serializers.FileField(write_only=True)
    questions = ExtractedQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = QuestionPaper
        fields = ["id", "document", "processing_status", "processing_error", "uploaded_at", "questions"]


class CanonicalDocumentStatusSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Document
        fields = ["id", "kind", "file", "status", "page_count", "error", "created_at", "updated_at"]
        read_only_fields = fields


class QuestionSerializer(serializers.ModelSerializer):
    """
    Comprehensive question serializer.
    Includes teacher metadata and dynamically redacts reference answers for students.
    """

    teacher_username = serializers.CharField(
        source="teacher.username", read_only=True
    )
    teacher_name = serializers.SerializerMethodField(read_only=True)
    submissions_count = serializers.IntegerField(
        source="submissions.count", read_only=True
    )

    class Meta:
        model = Question
        fields = [
            "id",
            "teacher",
            "exam",
            "parent",
            "choice_group",
            "source_page",
            "teacher_username",
            "teacher_name",
            "subject",
            "title",
            "question_text",
            "reference_answer",
            "max_marks",
            "marking_rubric",
            "submissions_count",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = [
            "id",
            "teacher",
            "teacher_username",
            "teacher_name",
            "submissions_count",
            "created_at",
            "updated_at",
        ]

    def get_teacher_name(self, obj) -> str:
        return obj.teacher.get_full_name() or obj.teacher.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        # Pedagogical protection: do not leak model reference answer or rubric to students
        if request and request.user.is_authenticated:
            if getattr(request.user, "role", None) == "STUDENT" and not (
                request.user.is_staff or request.user.is_superuser
            ):
                data.pop("reference_answer", None)
                data.pop("marking_rubric", None)
        return data


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used for creating and updating questions.
    """

    class Meta:
        model = Question
        fields = [
            "subject",
            "title",
            "question_text",
            "reference_answer",
            "max_marks",
            "marking_rubric",
            "is_active",
        ]

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Maximum marks must be a positive number greater than 0."
            )
        return value

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank or whitespace.")
        return value.strip()

    def validate_question_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Question text cannot be blank.")
        return value.strip()

    def validate_reference_answer(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Reference answer is required for AI evaluation."
            )
        return value.strip()
