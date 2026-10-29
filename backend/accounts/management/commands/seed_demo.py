import os
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from courses.models import Course, Lesson, LiveSession


class Command(BaseCommand):
    help = "Crée les comptes et données de démo (idempotent)."

    def handle(self, *args, **options):
        User = get_user_model()
        prof_pwd = os.environ.get("DEMO_PROF_PASSWORD")
        student_pwd = os.environ.get("DEMO_STUDENT_PASSWORD")
        if not prof_pwd or not student_pwd:
            self.stdout.write("Mots de passe de démo absents : seed ignoré.")
            return

        prof, created = User.objects.get_or_create(
            email="prof.demo@example.com",
            defaults={"first_name": "Prof", "last_name": "Démo", "role": "PROFESSOR"},
        )
        if created:
            prof.set_password(prof_pwd)
            prof.save()

        student, created = User.objects.get_or_create(
            email="etudiant.demo@example.com",
            defaults={"first_name": "Étudiant", "last_name": "Démo", "role": "STUDENT"},
        )
        if created:
            student.set_password(student_pwd)
            student.save()

        course, _ = Course.objects.get_or_create(
            teacher=prof,
            title="Introduction à Python",
            defaults={"description": "Les bases de Python pour débutants."},
        )
        Lesson.objects.get_or_create(
            course=course,
            title="Premiers pas",
            defaults={
                "description": "Installation et premier programme.",
                "video_url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
                "position": 1,
            },
        )
        # Dima 3and l'démo session Live f l'mosta9bal
        if not course.live_sessions.filter(scheduled_at__gte=timezone.now()).exists():
            LiveSession.objects.create(
                course=course,
                title="Live de démonstration",
                scheduled_at=timezone.now() + timedelta(days=7),
                join_url="https://meet.jit.si/CoursLiveDemo",
            )

        self.stdout.write(self.style.SUCCESS("Données de démo prêtes."))