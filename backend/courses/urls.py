from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, LessonViewSet, LiveSessionViewSet

router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
router.register("lessons", LessonViewSet, basename="lesson")
router.register("live-sessions", LiveSessionViewSet, basename="live-session")

urlpatterns = router.urls