import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import CourseForm from "../components/CourseForm";

export default function ProfessorDashboard() {
  const { user, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // cours en cours de modification
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [message, setMessage] = useState(null); // { type, text }

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/courses/mine/");
      setCourses(data);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError("");
  };

  const handleSave = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.patch(`/courses/${editing.id}/`, values);
        setMessage({ type: "success", text: "Cours modifié avec succès." });
      } else {
        await api.post("/courses/", values);
        setMessage({ type: "success", text: "Cours créé avec succès." });
      }
      closeForm();
      await loadCourses();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    const ok = window.confirm(
      `Supprimer le cours « ${course.title} » ? Ses leçons et sessions Live seront aussi supprimées.`
    );
    if (!ok) return;
    try {
      await api.delete(`/courses/${course.id}/`);
      setMessage({ type: "success", text: "Cours supprimé." });
      await loadCourses();
    } catch (err) {
      setMessage({ type: "danger", text: errorMessage(err) });
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Espace Professeur</h1>
          <small className="text-muted">Bienvenue {user.first_name} 👋</small>
        </div>
        <button className="btn btn-outline-secondary" onClick={logout}>
          Se déconnecter
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} d-flex justify-content-between`}>
          <span>{message.text}</span>
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Mes cours</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Nouveau cours
          </button>
        )}
      </div>

      {showForm && (
        <CourseForm
          key={editing ? editing.id : "new"}
          initial={editing}
          onSubmit={handleSave}
          onCancel={closeForm}
          submitting={saving}
          error={formError}
        />
      )}

      {loading && <p>Chargement…</p>}

      {loadError && (
        <div className="alert alert-danger">
          {loadError}{" "}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={loadCourses}>
            Réessayer
          </button>
        </div>
      )}

      {!loading && !loadError && courses.length === 0 && (
        <div className="text-center text-muted border rounded p-5">
          <p className="mb-2">Vous n'avez pas encore de cours.</p>
          <p className="mb-0">Cliquez sur « Nouveau cours » pour commencer.</p>
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
                <span className="badge text-bg-light">
                  {course.lessons_count} leçon{course.lessons_count > 1 ? "s" : ""}
                </span>
              </div>
              <div className="card-footer d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(course)}>
                  Modifier
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(course)}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}