"""
Django settings for EvalAI project.
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

SECRET_KEY = os.getenv(
    "SECRET_KEY", "evalai-insecure-django-dev-secret-key-change-in-production-2026"
)

DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t", "yes")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0,testserver"
    ).split(",")
    if host.strip()
]
if "testserver" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("testserver")

# Application definition
INSTALLED_APPS = [
    # Unfold must appear BEFORE django.contrib.admin
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party packages
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # EvalAI apps
    "accounts",
    "questions",
    "submissions",
    "evaluations",
    "dashboard",
    
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Custom User Model
AUTH_USER_MODEL = "accounts.User"

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "EXCEPTION_HANDLER": "config.exceptions.custom_exception_handler",
}

# CORS Configuration
cors_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_env:
    CORS_ALLOWED_ORIGINS = [
        origin.strip() for origin in cors_env.split(",") if origin.strip()
    ]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5500",
    ]

# Google Gemini API Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Django Unfold Configuration
UNFOLD = {
    "SITE_TITLE": "EvalAI Administration",
    "SITE_HEADER": "EvalAI",
    "SITE_SUBHEADER": "AI-Powered Answer Evaluation System",
    "SITE_URL": "/",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,
    "DASHBOARD_CALLBACK": "dashboard.admin.dashboard_callback",
    "SIDEBAR": {
        "show_search": False,
        "show_all_applications": False,
        "navigation": [
            {
                "title": _("Dashboard"),
                "separator": True,
                "items": [
                    {
                        "title": _("Overview"),
                        "icon": "dashboard",
                        "link": reverse_lazy("admin:index"),
                    },
                    {
                        "title": _("System Statistics"),
                        "icon": "analytics",
                        "link": reverse_lazy("admin:index"),
                    },
                ],
            },
            {
                "title": _("User Management"),
                "separator": True,
                "items": [
                    {
                        "title": _("Teachers"),
                        "icon": "school",
                        "link": lambda request: f"{reverse_lazy('admin:accounts_user_changelist')}?role__exact=TEACHER",
                    },
                    {
                        "title": _("Students"),
                        "icon": "person",
                        "link": lambda request: f"{reverse_lazy('admin:accounts_user_changelist')}?role__exact=STUDENT",
                    },
                    {
                        "title": _("All Users"),
                        "icon": "group",
                        "link": reverse_lazy("admin:accounts_user_changelist"),
                    },
                ],
            },
            {
                "title": _("Academic Management"),
                "separator": True,
                "items": [
                    {
                        "title": _("Questions"),
                        "icon": "quiz",
                        "link": reverse_lazy("admin:questions_question_changelist"),
                    },
                    {
                        "title": _("Subjects"),
                        "icon": "menu_book",
                        "link": reverse_lazy("admin:questions_question_changelist"),
                    },
                ],
            },
            {
                "title": _("Submissions"),
                "separator": True,
                "items": [
                    {
                        "title": _("All Submissions"),
                        "icon": "assignment",
                        "link": reverse_lazy("admin:submissions_submission_changelist"),
                    },
                    {
                        "title": _("Pending Evaluation"),
                        "icon": "hourglass_top",
                        "link": lambda request: f"{reverse_lazy('admin:submissions_submission_changelist')}?status__exact=SUBMITTED",
                    },
                    {
                        "title": _("Evaluated Submissions"),
                        "icon": "task_alt",
                        "link": lambda request: f"{reverse_lazy('admin:submissions_submission_changelist')}?status__exact=EVALUATED",
                    },
                ],
            },
            {
                "title": _("AI Evaluation"),
                "separator": True,
                "items": [
                    {
                        "title": _("Evaluation Results"),
                        "icon": "psychology",
                        "link": reverse_lazy("admin:evaluations_evaluation_changelist"),
                    },
                    {
                        "title": _("Pending Teacher Review"),
                        "icon": "pending_actions",
                        "link": lambda request: f"{reverse_lazy('admin:evaluations_evaluation_changelist')}?teacher_review_status__exact=PENDING",
                    },
                    {
                        "title": _("Approved Evaluations"),
                        "icon": "verified",
                        "link": lambda request: f"{reverse_lazy('admin:evaluations_evaluation_changelist')}?teacher_review_status__exact=APPROVED",
                    },
                    {
                        "title": _("Modified Evaluations"),
                        "icon": "edit_note",
                        "link": lambda request: f"{reverse_lazy('admin:evaluations_evaluation_changelist')}?teacher_review_status__exact=MODIFIED",
                    },
                ],
            },
        ],
    },
}
