from django.conf import settings
from django.http import HttpResponse


def react_app(request, path=""):
    """Kay'servi index.html dyal React l kol route /app/..."""
    index = settings.FRONTEND_DIST / "index.html"
    if not index.exists():
        return HttpResponse(
            "Frontend non construit. Lancez : cd frontend && npm run build",
            status=501,
        )
    return HttpResponse(index.read_text(encoding="utf-8"))