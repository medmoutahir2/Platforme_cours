import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import VideoPlayer from "../components/VideoPlayer";

const formatDate = (iso) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });

export default function CourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentId, setCurrentId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/courses/${id}/`);
      setCourse(data);
      setCurrentId(data.lessons[0]?.id ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-center mt-5">Chargement…</p>;

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          {error}{" "}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={load}>Réessayer</button>
        </div>
        <Link to="/student" className="btn btn-outline-secondary">← Retour</Link>
      </div>
    );
  }

  const lessons = course.lessons;
  const current = lessons.find((l) => l.id === currentId);
  const upcoming = course.live_sessions.filter((s) => new Date(s.scheduled_at) >= new Date());

  return (
    <div className="container py-4">
      <Link to="/student" className="text-decoration-none">← Tous les cours</Link>
      <h1 className="h3 mt-2">{course.title}</h1>
      <p className="text-muted">
        {course.description}
        <br />
        <small>Par {course.teacher_name}</small>
      </p>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          {lessons.length === 0 && (
            <div className="text-center text-muted border rounded p-5">
              Ce cours n'a pas encore de leçons.
            </div>
          )}

          {current && (
            <>
              <VideoPlayer url={current.video_url} />
              <h2 className="h5 mt-3">{current.title}</h2>
              <p className="text-muted">{current.description}</p>
            </>
          )}
        </div>

        <div className="col-12 col-lg-4">
          <h2 className="h6">Leçons ({lessons.length})</h2>
          <div className="list-group mb-4">
            {lessons.map((l) => (
              <button
                key={l.id}
                className={`list-group-item list-group-item-action ${l.id === currentId ? "active" : ""}`}
                onClick={() => setCurrentId(l.id)}
              >
                {l.position}. {l.title}
              </button>
            ))}
          </div>

          <h2 className="h6">Sessions Live à venir</h2>
          {upcoming.length === 0 ? (
            <p className="text-muted small">Aucune session Live programmée.</p>
          ) : (
            <ul className="list-group">
              {upcoming.map((s) => (
                <li key={s.id} className="list-group-item">
                  <div className="fw-semibold">{s.title}</div>
                  <div className="small text-muted mb-2">{formatDate(s.scheduled_at)}</div>
                  <a href={s.join_url} target="_blank" rel="noreferrer"
                     className="btn btn-sm btn-danger">
                    Rejoindre le Live
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}