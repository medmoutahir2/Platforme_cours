from rest_framework import permissions


class IsProfessor(permissions.BasePermission):
    message = "Action réservée aux professeurs."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "PROFESSOR")


class IsCourseOwner(permissions.BasePermission):
    """Prof ma ymodifi/ymas7 ghir dyal cours dyalo (o leçons/lives dyalo)."""
    message = "Vous ne pouvez modifier que vos propres cours."

    def has_object_permission(self, request, view, obj):
        course = getattr(obj, "course", obj)
        return course.teacher_id == request.user.id