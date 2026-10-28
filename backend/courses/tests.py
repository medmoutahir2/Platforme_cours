from django.test import TestCase

# Create your tests here.
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()
PWD = "Passw0rd!xyz"


class AccessControlTests(APITestCase):
    def setUp(self):
        self.prof = User.objects.create_user(email="prof@test.com", password=PWD, role="PROFESSOR")
        self.prof2 = User.objects.create_user(email="prof2@test.com", password=PWD, role="PROFESSOR")
        self.student = User.objects.create_user(email="etu@test.com", password=PWD, role="STUDENT")

    def _course(self, owner):
        self.client.force_authenticate(owner)
        r = self.client.post("/api/courses/", {"title": "Python", "description": "Intro"})
        self.client.force_authenticate(None)
        return r.data["id"]

    def test_anonymous_blocked(self):
        r = self.client.get("/api/courses/")
        self.assertIn(r.status_code, (401, 403))

    def test_student_can_read_but_not_create(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/courses/").status_code, 200)
        r = self.client.post("/api/courses/", {"title": "X", "description": "Y"})
        self.assertEqual(r.status_code, 403)

    def test_professor_can_create(self):
        self.client.force_authenticate(self.prof)
        r = self.client.post("/api/courses/", {"title": "Django", "description": "API"})
        self.assertEqual(r.status_code, 201)

    def test_other_professor_cannot_delete(self):
        cid = self._course(self.prof)
        self.client.force_authenticate(self.prof2)
        self.assertEqual(self.client.delete(f"/api/courses/{cid}/").status_code, 403)

    def test_cannot_add_lesson_to_foreign_course(self):
        cid = self._course(self.prof)
        self.client.force_authenticate(self.prof2)
        r = self.client.post("/api/lessons/", {
            "course": cid, "title": "L1", "description": "d",
            "video_url": "https://www.youtube.com/watch?v=abc", "position": 1,
        })
        self.assertEqual(r.status_code, 400)

    def test_register_login_logout(self):
        r = self.client.post("/api/auth/register/", {
            "email": "New@Test.com", "password": PWD,
            "first_name": "A", "last_name": "B", "role": "STUDENT",
        })
        self.assertEqual(r.status_code, 201)
        self.assertEqual(self.client.get("/api/auth/me/").data["email"], "new@test.com")
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        bad = self.client.post("/api/auth/login/", {"email": "new@test.com", "password": "wrong"})
        self.assertEqual(bad.status_code, 400)