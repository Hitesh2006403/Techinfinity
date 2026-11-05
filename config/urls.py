"""
URL configuration for EvalAI project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from django.template import engines
from django.contrib.staticfiles.urls import staticfiles_urlpatterns


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


def frontend_view(request):
    """Serve the compiled vanilla frontend through Django's Jinja template engine."""
    template = engines["jinja2"].get_template("frontend/index.html")
    return HttpResponse(template.render({"static_url": settings.STATIC_URL}, request))


urlpatterns = [
    path("", frontend_view, name="frontend"),
    path("api/health/", root_health_view, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/questions/", include("questions.urls")),
    path("api/submissions/", include("submissions.urls")),
    path("api/evaluations/", include("evaluations.urls")),
    path("api/dashboard/", include("dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
