"""Create a small, repeatable EADAES development dataset."""

from decimal import Decimal
import os

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from questions.models import Enrollment, Exam, Question, SubjectResource


class Command(BaseCommand):
    help = "Create demo accounts, an enrolled demo student, and a demo subject without documents."

    @transaction.atomic
    def handle(self, *args, **options):
        teacher, teacher_created = User.objects.get_or_create(
            username="demo_teacher",
            defaults={
                "email": "teacher@eadaes.local",
                "first_name": "Demo",
                "last_name": "Teacher",
                "role": User.Role.TEACHER,
            },
        )
        teacher.email = "teacher@eadaes.local"
        teacher.role = User.Role.TEACHER
        teacher.first_name = "Demo"
        teacher.last_name = "Teacher"
        password = os.getenv("EVALAI_DEMO_TEACHER_PASSWORD", "")
        if password:
            teacher.set_password(password)
        elif teacher_created:
            teacher.set_unusable_password()
        teacher.save()

        student, student_created = User.objects.get_or_create(
            username="demo_student",
            defaults={
                "email": "student@eadaes.local",
                "first_name": "Demo",
                "last_name": "Student",
                "role": User.Role.STUDENT,
            },
        )
        student.email = "student@eadaes.local"
        student.role = User.Role.STUDENT
        student.first_name = "Demo"
        student.last_name = "Student"
        password = os.getenv("EVALAI_DEMO_STUDENT_PASSWORD", "")
        if password:
            student.set_password(password)
        elif student_created:
            student.set_unusable_password()
        student.save()

        subject, _ = SubjectResource.objects.get_or_create(
            teacher=teacher,
            name="Software Engineering",
            defaults={
                "code": "SE101",
                "semester": "Semester 5",
                "academic_year": "2026-2027",
                "notes_description": "Demo subject for testing the EADAES review workflow.",
            },
        )
        subject.code = "SE101"
        subject.semester = "Semester 5"
        subject.academic_year = "2026-2027"
        subject.notes_description = "Demo subject for testing the EADAES review workflow."
        subject.save()

        # Enroll demo student
        enrollment, _ = Enrollment.objects.get_or_create(
            subject=subject,
            student=student,
        )

        # Legacy question for backward compatibility
        question, _ = Question.objects.get_or_create(
            teacher=teacher,
            subject=subject.name,
            title="Explain requirements traceability",
            defaults={
                "question_text": "Explain why requirements traceability matters in software projects.",
                "reference_answer": "Traceability links requirements to design, implementation, and tests, making coverage and change impact visible.",
                "max_marks": Decimal("5.00"),
                "marking_rubric": "Award 2 marks for links across lifecycle artefacts, 2 for coverage/change impact, and 1 for a clear example.",
            },
        )
        question.is_active = True
        question.save(update_fields=["is_active"])

        self.stdout.write(self.style.SUCCESS("EADAES demo data is ready."))
        self.stdout.write("Teacher account configured: demo_teacher")
        self.stdout.write("Student account configured: demo_student (enrolled)")
        self.stdout.write(f"Subject: {subject.name} [{subject.code}] (question #{question.id})")
