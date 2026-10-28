from django.shortcuts import render

# Create your views here.
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Course, Lesson, LiveSession
from .permissions import IsCourseOwner, IsProfessor
from .serializers import (CourseDetailSerializer, CourseSerializer,
                          LessonSerializer, LiveSessionSerializer)


class ProfessorWriteMixin:
    """Lecture: kol user connecté. Écriture: prof o proprietaire."""

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsProfessor(), IsCourseOwner()]


class CourseViewSet(ProfessorWriteMixin, viewsets.ModelViewSet):
    def get_queryset(self):
        return (Course.objects.select_related("teacher")
                .prefetch_related("lessons", "live_sessions")
                .annotate(lessons_count=Count("lessons", distinct=True)))

    def get_serializer_class(self):
        return CourseDetailSerializer if self.action == "retrieve" else CourseSerializer

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = self.get_queryset().filter(teacher=request.user)
        return Response(CourseSerializer(qs, many=True).data)


class LessonViewSet(ProfessorWriteMixin, viewsets.ModelViewSet):
    serializer_class = LessonSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related("course")
        course_id = self.request.query_params.get("course")
        if course_id and course_id.isdigit():
            qs = qs.filter(course_id=course_id)
        return qs


class LiveSessionViewSet(ProfessorWriteMixin, viewsets.ModelViewSet):
    serializer_class = LiveSessionSerializer

    def get_queryset(self):
        qs = LiveSession.objects.select_related("course")
        course_id = self.request.query_params.get("course")
        if course_id and course_id.isdigit():
            qs = qs.filter(course_id=course_id)
        if self.request.query_params.get("upcoming") == "true":
            qs = qs.filter(scheduled_at__gte=timezone.now())
        return qs