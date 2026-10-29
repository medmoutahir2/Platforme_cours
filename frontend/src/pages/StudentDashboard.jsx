import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

const formatDate = (iso) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, l] = await Promise.all([
        api.get("/courses/"),
        api.get("/live-sessions/?upcoming=true"),
      ]);
      setCourses(c.data);
      setLives(l.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Espace Étudiant</h1>
          <small className="text-muted">Bienvenue {user.first_name} 👋</small>
        </div>
        <button className="btn btn-outline-secondary" onClick={logout}>Se déconnecter</button>
      </div>

      {loading && <p>Chargement…</p>}

      {error && (
        <div className="alert alert-danger">
          {error}{" "}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={load}>Réessayer</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <h2 className="h5">Prochains Lives</h2>
          {lives.length === 0 ? (
            <p className="text-muted">Aucune session Live programmée pour le moment.</p>
          ) : (
            <ul className="list-group mb-4">
              {lives.map((s) => (
                <li key={s.id}
                    className="list-group-item d-flex justify-content-between align-items-center gap-3">
                  <div>
                    <div className="fw-semibold">{s.title}</div>
                    <div className="small text-muted">{formatDate(s.scheduled_at)}</div>
                  </div>
                  <a href={s.join_url} target="_blank" rel="noreferrer"
                     className="btn btn-sm btn-danger flex-shrink-0">
                    Rejoindre le Live
                  </a>
                </li>
              ))}
            </ul>
          )}

          <h2 className="h5">Cours disponibles</h2>
          {courses.length === 0 && (
            <div className="text-center text-muted border rounded p-5">
              Aucun cours disponible pour le moment.
            </div>
          )}

          <div className="row g-3">
            {courses.map((course) => (
              <div className="col-12 col-md-6 col-lg-4" key={course.id}>
                <div className="card h-100">
                  {course.cover_image_url && (
                    <img src={course.cover_image_url} alt="" className="card-img-top"
                         style={{ height: 160, objectFit: "cover" }}
                         onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  )}
                  <div className="card-body">
                    <h3 className="h6">{course.title}</h3>
                    <p className="card-text text-muted small">{course.description}</p>
                    <small className="text-muted">
                      Par {course.teacher_name} · {course.lessons_count} leçon
                      {course.lessons_count > 1 ? "s" : ""}
                    </small>
                  </div>
                  <div className="card-footer">
                    <Link className="btn btn-sm btn-primary" to={`/student/courses/${course.id}`}>
                      Ouvrir le cours
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}