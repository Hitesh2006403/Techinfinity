from decimal import Decimal
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from questions.models import Question
from submissions.models import Submission
from evaluations.models import Evaluation

User = get_user_model()


def set_bootstrap_password(user, variable_name):
    password = os.getenv(variable_name, "")
    if password:
        user.set_password(password)
    else:
        user.set_unusable_password()


class Command(BaseCommand):
    help = "Sets up initial superuser, demo teachers, students, questions, and submissions for EvalAI."

    def handle(self, *args, **options):
        self.stdout.write("Configuring EvalAI initial data...")

        # 1. Superuser / Admin
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@evalai.com",
                "first_name": "EvalAI",
                "last_name": "Administrator",
                "role": User.Role.TEACHER,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            set_bootstrap_password(admin_user, "EVALAI_SETUP_ADMIN_PASSWORD")
            admin_user.save()
            Token.objects.get_or_create(user=admin_user)
            self.stdout.write(self.style.SUCCESS("Account created; configure its password securely before login."))
        else:
            self.stdout.write("Superuser 'admin' already exists.")

        # 2. Demo Teacher
        teacher, created = User.objects.get_or_create(
            username="prof_sharma",
            defaults={
                "email": "sharma@evalai.edu",
                "first_name": "Prof. Rajesh",
                "last_name": "Sharma",
                "role": User.Role.TEACHER,
                "is_staff": False,
            },
        )
        if created:
            set_bootstrap_password(teacher, "EVALAI_SETUP_TEACHER_PASSWORD")
            teacher.save()
            Token.objects.get_or_create(user=teacher)
            self.stdout.write(self.style.SUCCESS("Account created; configure its password securely before login."))

        # 3. Demo Students
        student1, created = User.objects.get_or_create(
            username="aravind_k",
            defaults={
                "email": "aravind@evalai.edu",
                "first_name": "Aravind",
                "last_name": "Kumar",
                "role": User.Role.STUDENT,
                "is_staff": False,
            },
        )
        if created:
            set_bootstrap_password(student1, "EVALAI_SETUP_STUDENT1_PASSWORD")
            student1.save()
            Token.objects.get_or_create(user=student1)
            self.stdout.write(self.style.SUCCESS("Account created; configure its password securely before login."))

        student2, created = User.objects.get_or_create(
            username="priya_s",
            defaults={
                "email": "priya@evalai.edu",
                "first_name": "Priya",
                "last_name": "Singh",
                "role": User.Role.STUDENT,
                "is_staff": False,
            },
        )
        if created:
            set_bootstrap_password(student2, "EVALAI_SETUP_STUDENT2_PASSWORD")
            student2.save()
            Token.objects.get_or_create(user=student2)
            self.stdout.write(self.style.SUCCESS("Account created; configure its password securely before login."))

        # 4. Demo Question
        q1, created = Question.objects.get_or_create(
            title="Explain Polymorphism in Object-Oriented Programming",
            teacher=teacher,
            defaults={
                "subject": "Computer Science",
                "question_text": (
                    "Define polymorphism in object-oriented programming. Differentiate between compile-time "
                    "and run-time polymorphism with code examples or conceptual explanations. Explain how dynamic dispatch operates."
                ),
                "reference_answer": (
                    "Polymorphism allows objects of different classes to be treated as objects of a common superclass. "
                    "Compile-time polymorphism is achieved via method overloading and operator overloading where the call is resolved at compile time. "
                    "Run-time polymorphism is achieved via method overriding where the call is resolved dynamically during execution using dynamic dispatch (vtables). "
                    "Key benefits include code reusability, modularity, and extensible interfaces."
                ),
                "max_marks": Decimal("10.00"),
                "marking_rubric": (
                    "1. Definition and core concept: 2 marks\n"
                    "2. Compile-time polymorphism explanation: 2.5 marks\n"
                    "3. Run-time polymorphism and method overriding: 2.5 marks\n"
                    "4. Dynamic dispatch / vtable explanation: 2 marks\n"
                    "5. Code examples or illustrative scenarios: 1 mark"
                ),
                "is_active": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Demo Question created: {q1.title}"))

        q2, created = Question.objects.get_or_create(
            title="Explain the ACID Properties in Relational Databases",
            teacher=teacher,
            defaults={
                "subject": "Database Systems",
                "question_text": (
                    "Detail the four ACID properties that guarantee reliable database transaction processing. "
                    "Discuss how each property protects database integrity during concurrent operations and system crashes."
                ),
                "reference_answer": (
                    "ACID stands for Atomicity, Consistency, Isolation, and Durability. "
                    "Atomicity ensures that all transaction operations either succeed entirely or roll back. "
                    "Consistency guarantees transitions from one valid state to another satisfying all schema constraints. "
                    "Isolation ensures concurrent transactions execute independently without interference, managed via isolation levels. "
                    "Durability guarantees committed transaction updates persist permanently in non-volatile storage despite subsequent system crashes."
                ),
                "max_marks": Decimal("10.00"),
                "marking_rubric": (
                    "1. Atomicity definition and rollback mechanism: 2.5 marks\n"
                    "2. Consistency definition and invariant preservation: 2.5 marks\n"
                    "3. Isolation definition and concurrency anomalies: 2.5 marks\n"
                    "4. Durability definition and WAL/journaling persistence: 2.5 marks"
                ),
                "is_active": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Demo Question created: {q2.title}"))

        # 5. Demo Submissions & Evaluations
        sub1, created = Submission.objects.get_or_create(
            question=q1,
            student=student1,
            defaults={
                "answer_text": (
                    "Polymorphism is the ability of an object to take on many forms. "
                    "Compile-time polymorphism is achieved through method overloading, where methods have the same name but different signatures. "
                    "Run-time polymorphism occurs through method overriding, where a subclass provides a specific implementation of a method defined in its superclass. "
                    "The JVM or runtime resolves method calls dynamically at runtime using virtual method tables (vtable), allowing flexible object-oriented design."
                ),
                "status": Submission.Status.REVIEWED,
            },
        )
        if created:
            Evaluation.objects.create(
                submission=sub1,
                suggested_marks=Decimal("9.00"),
                max_marks=Decimal("10.00"),
                feedback="Excellent conceptual clarity! You clearly delineated compile-time vs runtime mechanisms.",
                concepts_found=[
                    "Accurate definition of polymorphism",
                    "Method overloading for compile-time polymorphism",
                    "Method overriding for runtime polymorphism",
                    "Mentioned dynamic dispatch and vtable lookup",
                ],
                missing_concepts=["Could have included a concise syntax snippet or code example."],
                incorrect_concepts=[],
                criterion_wise_marks=[
                    {"criterion": "Definition", "marks_awarded": 2.0, "max_marks": 2.0, "reason": "Accurate definition"},
                    {"criterion": "Compile-time", "marks_awarded": 2.5, "max_marks": 2.5, "reason": "Clear explanation of overloading"},
                    {"criterion": "Runtime", "marks_awarded": 2.5, "max_marks": 2.5, "reason": "Clear explanation of overriding"},
                    {"criterion": "Dynamic Dispatch", "marks_awarded": 2.0, "max_marks": 2.0, "reason": "Accurately noted vtable"},
                    {"criterion": "Code Examples", "marks_awarded": 0.0, "max_marks": 1.0, "reason": "Missing code snippet"},
                ],
                reasoning="The answer covers all theoretical components with precision, missing only an explicit code sample.",
                confidence=0.96,
                teacher_approved_marks=Decimal("9.00"),
                teacher_review_status=Evaluation.ReviewStatus.APPROVED,
                teacher_comments="Approved AI score. High quality submission.",
            )
            self.stdout.write(self.style.SUCCESS("Demo Submission 1 evaluated and approved."))

        sub2, created = Submission.objects.get_or_create(
            question=q2,
            student=student2,
            defaults={
                "answer_text": (
                    "ACID means Atomicity, Consistency, Isolation, Durability. "
                    "Atomicity means all or nothing. Consistency ensures the database follows rules. "
                    "Isolation prevents transactions from reading each other's uncommitted data. "
                    "Durability means once saved, data is not lost even if power fails."
                ),
                "status": Submission.Status.EVALUATED,
            },
        )
        if created:
            Evaluation.objects.create(
                submission=sub2,
                suggested_marks=Decimal("7.50"),
                max_marks=Decimal("10.00"),
                feedback="Good concise overview of ACID principles. Expand on isolation levels and write-ahead logging.",
                concepts_found=[
                    "Correctly identified all four acronym letters",
                    "Accurate all-or-nothing atomicity rule",
                    "Correct durability persistence statement",
                ],
                missing_concepts=[
                    "Did not discuss transaction isolation levels (e.g. Read Committed, Serializable)",
                    "Did not mention WAL (write-ahead log) or recovery mechanisms",
                ],
                incorrect_concepts=[],
                criterion_wise_marks=[
                    {"criterion": "Atomicity", "marks_awarded": 2.0, "max_marks": 2.5, "reason": "Brief but correct"},
                    {"criterion": "Consistency", "marks_awarded": 1.8, "max_marks": 2.5, "reason": "Lacks schema constraint depth"},
                    {"criterion": "Isolation", "marks_awarded": 1.7, "max_marks": 2.5, "reason": "Missing concurrency anomaly discussion"},
                    {"criterion": "Durability", "marks_awarded": 2.0, "max_marks": 2.5, "reason": "Good definition of non-volatile storage"},
                ],
                reasoning="Answer is correct in high-level concepts but lacks technical depth and discussion of database mechanisms.",
                confidence=0.92,
                teacher_approved_marks=None,
                teacher_review_status=Evaluation.ReviewStatus.PENDING,
            )
            self.stdout.write(self.style.SUCCESS("Demo Submission 2 evaluated (pending teacher review)."))

        self.stdout.write(self.style.SUCCESS("Successfully completed setup of demo data!"))
