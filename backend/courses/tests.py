from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

User = get_user_model()
PWD = "Passw0rd!xyz"
LIVE_DATE = "2030-01-01T10:00:00Z"


class BaseAPITestCase(APITestCase):
    def setUp(self):
        self.prof = User.objects.create_user(email="prof@test.com", password=PWD, role="PROFESSOR")
        self.prof2 = User.objects.create_user(email="prof2@test.com", password=PWD, role="PROFESSOR")
        self.student = User.objects.create_user(email="etu@test.com", password=PWD, role="STUDENT")

    def as_user(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def create_course(self, owner, title="Python"):
        r = self.as_user(owner).post("/api/courses/", {"title": title, "description": "Intro"})
        self.assertEqual(r.status_code, 201)
        return r.data["id"]

    def create_lesson(self, owner, course_id):
        r = self.as_user(owner).post("/api/lessons/", {
            "course": course_id, "title": "L1", "description": "d",
            "video_url": "https://www.youtube.com/watch?v=abc", "position": 1,
        })
        self.assertEqual(r.status_code, 201)
        return r.data["id"]

    def create_live(self, owner, course_id):
        r = self.as_user(owner).post("/api/live-sessions/", {
            "course": course_id, "title": "Live 1",
            "scheduled_at": LIVE_DATE, "join_url": "https://meet.jit.si/test",
        })
        self.assertEqual(r.status_code, 201)
        return r.data["id"]


class AccessControlTests(BaseAPITestCase):
    """Vérification 1 : qui a le droit de faire quoi (y compris par API directe)."""

    def test_anonymous_is_blocked_everywhere(self):
        for url in ("/api/courses/", "/api/lessons/", "/api/live-sessions/"):
            self.assertIn(self.client.get(url).status_code, (401, 403), url)

    def test_student_sees_all_courses(self):
        # Règle de visibilité : tout étudiant connecté voit tous les cours.
        cid = self.create_course(self.prof)
        r = self.as_user(self.student).get("/api/courses/")
        self.assertEqual(r.status_code, 200)
        self.assertIn(cid, [c["id"] for c in r.data])

    def test_student_cannot_create_anything(self):
        cid = self.create_course(self.prof)
        student = self.as_user(self.student)
        self.assertEqual(student.post("/api/courses/", {"title": "X", "description": "Y"}).status_code, 403)
        self.assertEqual(student.post("/api/lessons/", {
            "course": cid, "title": "L", "description": "d",
            "video_url": "https://youtu.be/abc", "position": 1}).status_code, 403)
        self.assertEqual(student.post("/api/live-sessions/", {
            "course": cid, "title": "Live", "scheduled_at": LIVE_DATE,
            "join_url": "https://meet.jit.si/x"}).status_code, 403)

    def test_student_cannot_modify_or_delete(self):
        cid = self.create_course(self.prof)
        lid = self.create_lesson(self.prof, cid)
        sid = self.create_live(self.prof, cid)
        student = self.as_user(self.student)
        self.assertEqual(student.patch(f"/api/courses/{cid}/", {"title": "Hack"}).status_code, 403)
        self.assertEqual(student.delete(f"/api/lessons/{lid}/").status_code, 403)
        self.assertEqual(student.delete(f"/api/live-sessions/{sid}/").status_code, 403)

    def test_other_professor_cannot_modify_or_delete_course(self):
        cid = self.create_course(self.prof)
        other = self.as_user(self.prof2)
        self.assertEqual(other.patch(f"/api/courses/{cid}/", {"title": "Hack"}).status_code, 403)
        self.assertEqual(other.delete(f"/api/courses/{cid}/").status_code, 403)
        # le cours existe toujours, inchangé
        r = self.as_user(self.prof).get(f"/api/courses/{cid}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["title"], "Python")

    def test_other_professor_cannot_touch_lesson_or_live(self):
        cid = self.create_course(self.prof)
        lid = self.create_lesson(self.prof, cid)
        sid = self.create_live(self.prof, cid)
        other = self.as_user(self.prof2)
        self.assertEqual(other.patch(f"/api/lessons/{lid}/", {"title": "Hack"}).status_code, 403)
        self.assertEqual(other.delete(f"/api/live-sessions/{sid}/").status_code, 403)

    def test_other_professor_cannot_add_to_foreign_course(self):
        cid = self.create_course(self.prof)
        other = self.as_user(self.prof2)
        r1 = other.post("/api/lessons/", {
            "course": cid, "title": "L", "description": "d",
            "video_url": "https://youtu.be/abc", "position": 1})
        r2 = other.post("/api/live-sessions/", {
            "course": cid, "title": "Live", "scheduled_at": LIVE_DATE,
            "join_url": "https://meet.jit.si/x"})
        self.assertEqual(r1.status_code, 400)
        self.assertEqual(r2.status_code, 400)

    def test_mine_returns_only_own_courses(self):
        self.create_course(self.prof, "A")
        self.create_course(self.prof2, "B")
        r = self.as_user(self.prof).get("/api/courses/mine/")
        self.assertEqual([c["title"] for c in r.data], ["A"])


class PersistenceTests(BaseAPITestCase):
    """Vérification 2 : les données sont enregistrées et retrouvées."""

    def test_data_persists_for_a_new_session(self):
        cid = self.create_course(self.prof)
        self.create_lesson(self.prof, cid)
        self.create_live(self.prof, cid)

        # Nouvelle connexion réelle (nouveau client, vrai login par l'API)
        fresh = APIClient()
        login = fresh.post("/api/auth/login/", {"email": "prof@test.com", "password": PWD})
        self.assertEqual(login.status_code, 200)

        r = fresh.get(f"/api/courses/{cid}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data["lessons"]), 1)
        self.assertEqual(len(r.data["live_sessions"]), 1)

    def test_deleting_course_deletes_its_lessons_and_lives(self):
        cid = self.create_course(self.prof)
        lid = self.create_lesson(self.prof, cid)
        sid = self.create_live(self.prof, cid)
        prof = self.as_user(self.prof)
        self.assertEqual(prof.delete(f"/api/courses/{cid}/").status_code, 204)
        self.assertEqual(prof.get(f"/api/lessons/{lid}/").status_code, 404)
        self.assertEqual(prof.get(f"/api/live-sessions/{sid}/").status_code, 404)


class AuthTests(APITestCase):
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

    def test_duplicate_email_and_weak_password_rejected(self):
        data = {"email": "a@test.com", "password": PWD,
                "first_name": "A", "last_name": "B", "role": "STUDENT"}
        self.assertEqual(self.client.post("/api/auth/register/", data).status_code, 201)
        self.client.post("/api/auth/logout/")
        self.assertEqual(self.client.post("/api/auth/register/", data).status_code, 400)
        weak = {**data, "email": "b@test.com", "password": "123"}
        self.assertEqual(self.client.post("/api/auth/register/", weak).status_code, 400)