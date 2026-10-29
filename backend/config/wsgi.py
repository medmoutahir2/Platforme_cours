import os

from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()

from django.conf import settings  # noqa: E402

# Kay'servi les fichiers dyal React (JS/CSS) mn /app/assets/...
application = WhiteNoise(application, root=settings.FRONTEND_DIST, prefix="app")