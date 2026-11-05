"""
URL configuration for EvalAI project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def root_health_view(request):
    return JsonResponse(
        {
            "service": "EvalAI API",
            "status": "healthy",
            "version": "1.0.0",
            "admin": "/admin/",
            "endpoints": {
                "auth": "/api/auth/",
                "questions": "/api/questions/",
                "submissions": "/api/submissions/",
                "evaluations": "/api/evaluations/",
                "dashboard": "/api/dashboard/",
            },
        }
    )


urlpatterns = [
    path("", root_health_view, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/questions/", include("questions.urls")),
    path("api/submissions/", include("submissions.urls")),
    path("api/evaluations/", include("evaluations.urls")),
    path("api/dashboard/", include("dashboard.urls")),
]
