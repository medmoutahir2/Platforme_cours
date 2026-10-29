# Étape 1 : build de React
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Étape 2 : Django
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist

CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate --noinput && python manage.py seed_demo && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-10000}"]