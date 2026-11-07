"""
Django settings for EvalAI project.
"""

from pathlib import Path
import os
import sys
from urllib.parse import urlparse
from dotenv import load_dotenv
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t", "yes")
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("SECRET_KEY must be set when DEBUG is false.")
    SECRET_KEY = "evalai-insecure-django-development-key-only"

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
    "django.contrib.postgres",
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
        "BACKEND": "django.template.backends.jinja2.Jinja2",
        "DIRS": [BASE_DIR / "templates_jinja"],
        "APP_DIRS": False,
        "OPTIONS": {
            "environment": "config.jinja2.environment",
        },
    },
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

# Database: SQLite remains the zero-setup local/test default. Docker and
# production select PostgreSQL with DB_ENGINE=postgres or DATABASE_URL/POSTGRES_DB.
database_engine = os.getenv("DB_ENGINE", "sqlite").lower()
database_url = os.getenv("DATABASE_URL", "").strip()
database_uses_postgres = database_engine in {"postgres", "postgresql"} or urlparse(database_url).scheme in {"postgres", "postgresql"}
if database_url and urlparse(database_url).scheme in {"postgres", "postgresql"}:
    parsed_database_url = urlparse(database_url)
    database_name = (parsed_database_url.path or "").lstrip("/")
    database_options = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": database_name,
        "USER": parsed_database_url.username or "",
        "PASSWORD": parsed_database_url.password or "",
        "HOST": parsed_database_url.hostname or "localhost",
        "PORT": str(parsed_database_url.port or "5432"),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
    }
    DATABASES = {"default": database_options}
elif database_engine in {"postgres", "postgresql"}:
    postgres_password = os.getenv("POSTGRES_PASSWORD", "").strip()
    if not postgres_password:
        raise ImproperlyConfigured("POSTGRES_PASSWORD must be set when DB_ENGINE=postgres.")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "eadaes"),
            "USER": os.getenv("POSTGRES_USER", "eadaes"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", postgres_password),
            "HOST": os.getenv("POSTGRES_HOST", "db"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
        }
    }
else:
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
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
FRONTEND_STATIC_DIR = BASE_DIR.parent / "frontend" / "dist"
STATICFILES_DIRS = [path for path in (BASE_DIR / "static", FRONTEND_STATIC_DIR) if path.exists()]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", str(not DEBUG)).lower() in ("true", "1", "yes")
if "test" in sys.argv:
    SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = max(
    0,
    int(os.getenv("SECURE_HSTS_SECONDS", "31536000" if not DEBUG else "0")),
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "false").lower() in ("true", "1", "yes")
SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "false").lower() in ("true", "1", "yes")

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
    "DEFAULT_THROTTLE_RATES": {"login": os.getenv("LOGIN_THROTTLE_RATE", "10/minute")},
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

# Groq API Settings
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")
EVAL_LLM_MOCK = os.getenv("EVAL_LLM_MOCK", "false").lower() in ("true", "1", "yes")
GROQ_VISION_BATCH_SIZE = max(1, int(os.getenv("GROQ_VISION_BATCH_SIZE", "3")))
GROQ_VISION_MAX_TOKENS = max(512, int(os.getenv("GROQ_VISION_MAX_TOKENS", "3500")))
GROQ_EVALUATION_MAX_TOKENS = max(256, int(os.getenv("GROQ_EVALUATION_MAX_TOKENS", "650")))
GROQ_EVALUATION_REPAIR_MAX_TOKENS = max(128, int(os.getenv("GROQ_EVALUATION_REPAIR_MAX_TOKENS", "380")))
SUBMISSION_STUCK_TIMEOUT_SECONDS = max(60, int(os.getenv("SUBMISSION_STUCK_TIMEOUT_SECONDS", "1800")))

# Provider-neutral LLM configuration. Groq is the currently integrated
# evaluator provider; Anthropic remains available through the adapter layer.
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5")
LLM_PROMPT_VERSION = os.getenv("LLM_PROMPT_VERSION", "eadaes-v1")
LLM_CONFIDENCE_THRESHOLD = float(os.getenv("LLM_CONFIDENCE_THRESHOLD", "0.65"))

SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")))

# Celery/Redis background processing
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_SQLITE_ASYNC = os.getenv("CELERY_SQLITE_ASYNC", "false").lower() in ("true", "1", "yes")
CELERY_TASK_ALWAYS_EAGER = (
    True
    if "test" in sys.argv
    else (
        True
        if not database_uses_postgres and not CELERY_SQLITE_ASYNC
        else os.getenv("CELERY_TASK_ALWAYS_EAGER", "False").lower() in ("true", "1", "yes")
    )
)
CELERY_TASK_EAGER_PROPAGATES = CELERY_TASK_ALWAYS_EAGER
CELERY_BEAT_SCHEDULE = {
    "fail-stuck-evaluations-every-five-minutes": {
        "task": "submissions.tasks.fail_stuck_submissions",
        "schedule": 300.0,
    },
}

# Django Unfold Configuration
UNFOLD = {
    "SITE_TITLE": "EADAES Administration",
    "SITE_HEADER": "EADAES",
    "SITE_SUBHEADER": "Explainable Automated Descriptive Answer Evaluation System",
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
