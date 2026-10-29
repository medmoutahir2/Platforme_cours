import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import LessonForm from "../components/LessonForm";
import LiveSessionsSection from "../components/LiveSessionsSection";
  
export default function CourseManage() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState(null);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get(`/courses/${id}/`);
      setCourse(data);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const openCreate = () => { setEditing(null); setFormError(""); setShowForm(true); };
  const openEdit = (lesson) => { setEditing(lesson); setFormError(""); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setFormError(""); };

  const handleSave = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...values, course: course.id };
      if (editing) {
        await api.patch(`/lessons/${editing.id}/`, payload);
        setMessage({ type: "success", text: "Leçon modifiée avec succès." });
      } else {
        await api.post("/lessons/", payload);
        setMessage({ type: "success", text: "Leçon ajoutée avec succès." });
      }
      closeForm();
      await loadCourse();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Supprimer la leçon « ${lesson.title} » ?`)) return;
    try {
      await api.delete(`/lessons/${lesson.id}/`);
      setMessage({ type: "success", text: "Leçon supprimée." });
      await loadCourse();
    } catch (err) {
      setMessage({ type: "danger", text: errorMessage(err) });
    }
  };

  if (loading) return <p className="text-center mt-5">Chargement…</p>;

  if (loadError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{loadError}</div>
        <Link to="/professor" className="btn btn-outline-secondary">← Retour</Link>
      </div>
    );
  }

  const lessons = course.lessons;

  return (
    <div className="container py-4">
      <Link to="/professor" className="text-decoration-none">← Mes cours</Link>

      <h1 className="h3 mt-2">{course.title}</h1>
      <p className="text-muted">{course.description}</p>

      {message && (
        <div className={`alert alert-${message.type} d-flex justify-content-between`}>
          <span>{message.text}</span>
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
        <h2 className="h5 mb-0">Leçons ({lessons.length})</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={openCreate}>+ Ajouter une leçon</button>
        )}
      </div>

      {showForm && (
        <LessonForm
          key={editing ? editing.id : "new"}
          initial={editing}
          defaultPosition={lessons.length + 1}
          onSubmit={handleSave}
          onCancel={closeForm}
          submitting={saving}
          error={formError}
        />
      )}

      {lessons.length === 0 && (
        <div className="text-center text-muted border rounded p-5">
          Ce cours n'a pas encore de leçons.
        </div>
      )}

      <ul className="list-group">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <div className="fw-semibold">{lesson.position}. {lesson.title}</div>
                <div className="small text-muted">{lesson.description}</div>
                <a href={lesson.video_url} target="_blank" rel="noreferrer" className="small">
                  Voir la vidéo
                </a>
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(lesson)}>
                  Modifier
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(lesson)}>
                  Supprimer
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <LiveSessionsSection
    courseId={course.id}
    sessions={course.live_sessions}
    onChanged={loadCourse}
  />
    </div>
  );
}