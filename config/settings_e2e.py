"""Isolated local HTTP-test settings; never use these for deployment."""

import os
from pathlib import Path

# Ensure the imported base settings cannot enable provider calls, telemetry,
# or HTTPS redirects for this isolated local-only configuration.
os.environ["DEBUG"] = "true"
os.environ["SECRET_KEY"] = "evalai-isolated-e2e-only-secret"
os.environ["EVAL_LLM_MOCK"] = "true"
os.environ["SENTRY_DSN"] = ""
os.environ["SECURE_SSL_REDIRECT"] = "false"
os.environ["SECURE_HSTS_SECONDS"] = "0"

from .settings import *  # noqa: F403

# The HTTP acceptance script and browser test perform several independent
# logins in one local run. Keep production login throttling intact while
# allowing repeatable isolated E2E cycles.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        **REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}),
        "login": "120/minute",
    },
}

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.getenv("E2E_DB_PATH", "/tmp/evalai-http-e2e.sqlite3"),
    }
}
MEDIA_ROOT = Path(os.getenv("E2E_MEDIA_ROOT", "/tmp/evalai-http-e2e-media"))
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "testserver"]
EVAL_LLM_MOCK = True
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
SENTRY_DSN = ""
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
