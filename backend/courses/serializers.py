from rest_framework import serializers
from .models import Course, Lesson, LiveSession


class OwnedCourseSerializer(serializers.ModelSerializer):
    """Base: kat'tcheck blli l'cours dyal l'prof li connecté."""

    def validate_course(self, course):
        if course.teacher_id != self.context["request"].user.id:
            raise serializers.ValidationError("Ce cours ne vous appartient pas.")
        return course


class LessonSerializer(OwnedCourseSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "course", "title", "description", "video_url", "position", "created_at"]
        read_only_fields = ["id", "created_at"]


class LiveSessionSerializer(OwnedCourseSerializer):
    class Meta:
        model = LiveSession
        fields = ["id", "course", "title", "scheduled_at", "join_url", "created_at"]
        read_only_fields = ["id", "created_at"]


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    lessons_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "description", "cover_image_url",
                  "teacher_name", "lessons_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}".strip() or obj.teacher.email


class CourseDetailSerializer(CourseSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    live_sessions = LiveSessionSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ["lessons", "live_sessions"]