# EvalAI Backend — Explainable Automated Descriptive Answer Evaluation System

[![Django](https://img.shields.io/badge/Django-6.1-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.18-red.svg)](https://www.django-rest-framework.org/)
[![Django Unfold](https://img.shields.io/badge/Admin-Django--Unfold-blue.svg)](https://unfoldadmin.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google--GenAI-orange.svg)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-29%20Passed-brightgreen.svg)]()

EvalAI is an AI-powered descriptive answer evaluation platform engineered for educators and institutions. Rather than relying on rigid keyword matching, EvalAI leverages **Google Gemini AI** to conduct semantic, rubric-guided evaluation of student answers.

EvalAI highlights:
- **Correct Concepts** identified in the student's submission.
- **Missing Concepts** absent from the student's submission.
- **Incorrect Concepts / Misconceptions**.
- **Criterion-Wise Marks Breakdown** with granular justification.
- **Explainable Reasoning** for the total marks allocated.
- **Constructive Pedagogical Feedback** for student improvement.
- **AI Confidence Estimate** (0.0 to 1.0).
- **Teacher Review & Override**: Teachers retain ultimate authority to approve or adjust marks.

EvalAI also provides a modern administrative experience powered by **Django Unfold**, featuring a custom analytics dashboard, dark/light theme support, and sidebar navigation.

---

## 1. Technology Stack

- **Framework**: Python 3.14+, Django 6.1
- **REST APIs**: Django REST Framework (DRF) 3.18
- **Database**: SQLite (ACID compliant, zero external setup for rapid hackathon deployment)
- **Admin UI**: Django Unfold (`django-unfold`) with Tailwind CSS & Material Symbols
- **AI Engine**: Google Gemini API via official SDK (`google-genai`)
- **Authentication**: Django Token Authentication (`rest_framework.authtoken`) & Password Hashing
- **CORS Support**: `django-cors-headers`
- **Configuration**: `python-dotenv`

---

## 2. Django Application Architecture

The system is structured into five cohesive applications following the Single Responsibility Principle:

| Application | Responsibilities |
|---|---|
| `accounts` | Custom `User` model, role-based auth (`TEACHER`, `STUDENT`), registration, login, DRF tokens, Unfold user administration. |
| `questions` | Question creation, reference answers, maximum marks, grading rubrics, active/inactive toggles, teacher permissions. |
| `submissions`| Student answer submission lifecycle (`SUBMITTED`, `EVALUATED`, `REVIEWED`), student ownership permissions. |
| `evaluations` | Google Gemini AI integration (`services.py`), explainable semantic scoring, JSON validation, teacher approval & mark override. |
| `dashboard` | Dynamic ORM aggregation for teacher & student REST metrics, Unfold admin dashboard callback with live KPI statistics. |

---

## 3. Project Directory Structure

```text
evalai-backend/
│
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── exceptions.py      # Centralized exception handler (clean error schema)
│   ├── responses.py       # Unified API response formatting helper
│   ├── settings.py        # Django, DRF, Unfold, CORS, and Gemini configuration
│   ├── urls.py            # Master routing table
│   └── wsgi.py
│
├── accounts/
│   ├── migrations/        # Initial migration with custom User model
│   ├── management/
│   │   └── commands/
│   │       └── setup_demo_data.py # Seeds superuser & sample accounts
│   ├── admin.py           # Unfold User admin with role badges
│   ├── apps.py
│   ├── models.py          # Custom User model (role: TEACHER / STUDENT)
│   ├── permissions.py     # IsTeacher, IsStudent, IsStaffOrAdmin
│   ├── serializers.py     # Registration, login, profile serializers
│   ├── tests.py           # Authentication test suite
│   ├── urls.py            # /api/auth/ routes
│   └── views.py           # Register, login, me views
│
├── questions/
│   ├── migrations/
│   ├── admin.py           # Unfold Question admin
│   ├── apps.py
│   ├── models.py          # Question model with rubric and max_marks
│   ├── permissions.py     # IsTeacherOwnerOrReadOnly
│   ├── serializers.py     # Question & rubric serializers
│   ├── tests.py           # Question permissions & CRUD test suite
│   ├── urls.py            # /api/questions/ routes
│   └── views.py           # Question list/create & detail views
│
├── submissions/
│   ├── migrations/
│   ├── admin.py           # Unfold Submission admin with status badges
│   ├── apps.py
│   ├── models.py          # Submission model (SUBMITTED, EVALUATED, REVIEWED)
│   ├── permissions.py     # IsStudentToSubmit, CanAccessSubmission
│   ├── serializers.py     # Submission submission and preview serializers
│   ├── tests.py           # Submission test suite
│   ├── urls.py            # /api/submissions/ routes
│   └── views.py           # Submission list/create & detail views
│
├── evaluations/
│   ├── migrations/
│   ├── admin.py           # Unfold Evaluation admin with audit fieldsets
│   ├── apps.py
│   ├── models.py          # Evaluation model with JSON fields
│   ├── permissions.py     # CanEvaluateSubmission, IsTeacherOwnerForReview
│   ├── serializers.py     # Evaluation & Teacher review serializers
│   ├── services.py        # Gemini AI evaluation service engine
│   ├── tests.py           # Mocked AI evaluation & teacher review test suite
│   ├── urls.py            # /api/evaluations/ routes
│   └── views.py           # Evaluate, retrieve, approve, update-marks views
│
├── dashboard/
│   ├── migrations/
│   ├── admin.py           # dashboard_callback for Unfold Admin
│   ├── apps.py
│   ├── models.py
│   ├── tests.py           # Dashboard metrics & permissions test suite
│   ├── urls.py            # /api/dashboard/ routes
│   └── views.py           # TeacherDashboardView & StudentDashboardView
│
├── templates/
│   └── admin/
│       └── index.html     # Custom Unfold dashboard index with KPI widgets
│
├── manage.py
├── requirements.txt
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Installation & Quickstart

### 4.1 Clone / Navigate to Directory
```bash
cd evalai-backend
```

### 4.2 Set Up Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4.3 Install Dependencies
```bash
pip install -r requirements.txt
```

### 4.4 Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Gemini API key:
```env
SECRET_KEY=evalai-insecure-django-dev-secret-key-change-in-production-2026
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,testserver

# Google Gemini API
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5500
```

### 4.5 Apply Migrations & Seed Initial Data
```bash
python manage.py migrate
python manage.py setup_demo_data
```

The `setup_demo_data` command creates ready-to-use accounts and sample questions:
- **Admin**: `admin` / `Admin@123456` (Staff / Superuser)
- **Teacher**: `prof_sharma` / `Teacher@123456`
- **Student 1**: `aravind_k` / `Student@123456`
- **Student 2**: `priya_s` / `Student@123456`

---

## 5. Running the Backend Server

Start the Django development server:
```bash
python manage.py runserver
```
The server will start at `http://127.0.0.1:8000/`.

- **API Root / Health Check**: `http://127.0.0.1:8000/`
- **Django Unfold Admin UI**: `http://127.0.0.1:8000/admin/`

---

## 6. Django Unfold Admin Dashboard

Log in to `http://127.0.0.1:8000/admin/` with credentials:
- **Username**: `admin`
- **Password**: `Admin@123456`

### 6.1 Admin Features
1. **Real-Time KPI Cards**:
   - Total Users (with Teacher & Student count pills)
   - Total Questions
   - Total Submissions (Pending vs Evaluated counts)
   - Teacher Review Status (Pending, Approved, Modified)
2. **Interactive Activity Widgets**:
   - **Recent Student Submissions** table with status badges (`SUBMITTED`, `EVALUATED`, `REVIEWED`).
   - **AI Evaluations Awaiting Teacher Review** table with direct links to approve or adjust marks.
   - **Recently Created Questions** table.
   - **Recently Evaluated Answers** table with AI scores and confidence values.
3. **Sidebar Organization**:
   - **Dashboard**: Overview, System Statistics
   - **User Management**: Teachers, Students, All Users
   - **Academic Management**: Questions, Subjects
   - **Submissions**: All Submissions, Pending Evaluation, Evaluated Submissions
   - **AI Evaluation**: Evaluation Results, Pending Teacher Review, Approved Evaluations, Modified Evaluations
4. **Model Configurations**:
   - Role badges, confidence badges, score displays, autocomplete search, date filters, and JSON viewing.

---

## 7. Standard API Response Formats

All API endpoints strictly follow uniform JSON envelopes:

### Success Response (`200 OK`, `201 CREATED`)
```json
{
    "success": true,
    "message": "Operation completed successfully.",
    "data": { ... }
}
```

### Error Response (`400 BAD REQUEST`, `401`, `403`, `404`, `422`, `500`)
```json
{
    "success": false,
    "message": "Human-readable error description.",
    "errors": {
        "field_name": ["Specific validation error message."]
    }
}
```

---

## 8. REST API Reference

Include the header `Authorization: Token <your_token>` on all authenticated requests.

### 8.1 Authentication APIs

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register/teacher/` | Register a non-staff teacher account | No |
| `POST` | `/api/auth/register/student/` | Register a non-staff student account | No |
| `POST` | `/api/auth/login/` | Log in with email & password | No |
| `GET` | `/api/auth/me/` | Fetch current user profile & role | Yes |
| `POST` | `/api/auth/logout/` | Invalidate the current authentication token | Yes |

#### Teacher or Student Registration Request Body:
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "confirm_password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe"
}
```

The registration URL determines the role. Public payloads cannot assign roles,
staff access, or superuser access.

#### Login Request Body:
```json
{
    "email": "john@example.com",
    "password": "SecurePassword123!"
}
```

---

### 8.2 Question Management APIs

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/questions/` | List questions (supports `?subject=`; teachers see only their own) | Authenticated |
| `POST` | `/api/questions/` | Create a new question with rubric | `TEACHER` |
| `GET` | `/api/questions/<id>/` | Question details (Redacts reference answer for students) | Authenticated |
| `PUT` | `/api/questions/<id>/` | Replace question details | Question Owner (`TEACHER`) |
| `PATCH` | `/api/questions/<id>/` | Partial question update | Question Owner (`TEACHER`) |
| `DELETE` | `/api/questions/<id>/` | Delete question | Question Owner (`TEACHER`) |

#### Create Question Request Body:
```json
{
    "subject": "Data Structures",
    "title": "Explain Balanced Binary Trees (AVL Trees)",
    "question_text": "Define an AVL tree. Explain the concept of balance factor and describe the 4 types of rotations.",
    "reference_answer": "An AVL tree is a self-balancing binary search tree where the heights of two child subtrees differ by at most one. Rotations include LL, RR, LR, and RL.",
    "max_marks": 10.0,
    "marking_rubric": "1. Definition & Balance Factor: 3 marks\n2. Single Rotations (LL, RR): 3 marks\n3. Double Rotations (LR, RL): 4 marks",
    "is_active": true
}
```

---

### 8.3 Student Submission APIs

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `POST` | `/api/submissions/` | Submit answer to a question | `STUDENT` |
| `GET` | `/api/submissions/` | List submissions (Student sees theirs; Teacher sees questions they own) | Authenticated |
| `GET` | `/api/submissions/<id>/` | Submission details | Student Owner or Teacher |
| `POST` | `/api/submissions/<id>/evaluate/` | Trigger Gemini AI evaluation | Question Owner (`TEACHER`) or staff |
| `GET` | `/api/submissions/<id>/evaluation/` | View evaluation for submission | Student Owner or Teacher |

#### Submit Answer Request Body:
```json
{
    "question_id": 1,
    "answer_text": "An AVL tree is a self-balancing binary search tree. For every node, the height difference between the left and right subtree (balance factor) must be -1, 0, or 1. When an insertion causes unbalance, rotations restore order. Left-Left (LL) and Right-Right (RR) are single rotations, while Left-Right (LR) and Right-Left (RL) are double rotations."
}
```

---

### 8.4 Evaluation & Teacher Review APIs

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/evaluations/<id>/` | Fetch evaluation result | Student Owner or Teacher |
| `POST` | `/api/evaluations/<id>/approve/` | Teacher approves AI suggested marks | Question Owner (`TEACHER`) |
| `POST` | `/api/evaluations/<id>/update-marks/` | Teacher modifies marks & adds comments | Question Owner (`TEACHER`) |

#### Evaluation Output Example:
```json
{
    "success": true,
    "message": "Submission evaluated successfully by Gemini AI.",
    "data": {
        "evaluation": {
            "id": 1,
            "submission_id": 1,
            "student_username": "aravind_k",
            "question_title": "Explain Polymorphism in Object-Oriented Programming",
            "suggested_marks": "9.00",
            "max_marks": "10.00",
            "final_marks": "9.00",
            "feedback": "Excellent conceptual clarity! You clearly delineated compile-time vs runtime mechanisms.",
            "concepts_found": [
                "Accurate definition of polymorphism",
                "Method overloading for compile-time polymorphism",
                "Method overriding for runtime polymorphism",
                "Mentioned dynamic dispatch and vtable lookup"
            ],
            "missing_concepts": [
                "Could have included a concise syntax snippet or code example."
            ],
            "incorrect_concepts": [],
            "criterion_wise_marks": [
                {
                    "criterion": "Definition",
                    "marks_awarded": 2.0,
                    "max_marks": 2.0,
                    "reason": "Accurate definition"
                },
                {
                    "criterion": "Compile-time",
                    "marks_awarded": 2.5,
                    "max_marks": 2.5,
                    "reason": "Clear explanation of overloading"
                },
                {
                    "criterion": "Runtime",
                    "marks_awarded": 2.5,
                    "max_marks": 2.5,
                    "reason": "Clear explanation of overriding"
                },
                {
                    "criterion": "Dynamic Dispatch",
                    "marks_awarded": 2.0,
                    "max_marks": 2.0,
                    "reason": "Accurately noted vtable"
                }
            ],
            "reasoning": "The answer covers all theoretical components with precision, missing only an explicit code sample.",
            "confidence": 0.96,
            "teacher_approved_marks": null,
            "teacher_review_status": "PENDING",
            "teacher_comments": "",
            "evaluated_at": "2026-11-05T13:41:22.012345+05:30",
            "reviewed_at": null
        }
    }
}
```

#### Approve Evaluation Request Body:
```json
{
    "teacher_comments": "Verified and approved without modification."
}
```

#### Modify Marks Request Body:
```json
{
    "approved_marks": "9.50",
    "teacher_comments": "Increased score by 0.5 for concise and elegant phrasing."
}
```

---

### 8.5 Dashboard Analytics APIs

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/dashboard/teacher/` | Aggregated teacher questions, submissions & reviews | `TEACHER` |
| `GET` | `/api/dashboard/student/` | Student submissions, reviewed counts & average score % | `STUDENT` |

---

## 9. Frontend Integration Guide

The EvalAI backend is fully decoupled from the Unfold admin and serves standard REST JSON over CORS.

### Supported Frontend Origins
Configured in `settings.py` / `.env`:
- `http://localhost:3000` (React / Next.js)
- `http://localhost:5173` (Vite)
- `http://127.0.0.1:5500` (VS Code Live Server)

### Axios / Fetch Setup
Store the token received from `/api/auth/login/` or `/api/auth/register/` in `localStorage` or `sessionStorage`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('evalai_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
```

---

## 10. Automated Testing

EvalAI includes 29 automated test cases covering authentication, permissions, CRUD, mocked Gemini evaluations, mark overrides, and dashboard metrics.

Run tests:
```bash
python manage.py test
```

Expected result:
```text
Ran 29 tests in 14.305s

OK
```

---

## 11. Troubleshooting

| Issue | Solution |
|---|---|
| `GEMINI_API_KEY is not configured` | Add your Gemini API key to `.env` as `GEMINI_API_KEY=...` |
| `DisallowedHost: Invalid HTTP_HOST header` | Ensure your hostname is added to `ALLOWED_HOSTS` in `.env` |
| CORS Error in browser | Add your frontend port/origin to `CORS_ALLOWED_ORIGINS` in `.env` |
| Admin styling not loading | Run `python manage.py collectstatic --noinput` |
