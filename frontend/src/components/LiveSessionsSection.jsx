import { useState } from "react";
import api, { errorMessage } from "../api";

function LiveForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    // datetime-local kay'7tj "YYYY-MM-DDTHH:mm"
    scheduled_at: initial?.scheduled_at ? initial.scheduled_at.slice(0, 16) : "",
    join_url: initial?.join_url ?? "",
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title.trim(),
      scheduled_at: form.scheduled_at,
      join_url: form.join_url.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-3">
      <h3 className="h6 mb-3">{initial ? "Modifier la session" : "Nouvelle session Live"}</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <label className="form-label">Titre *</label>
        <input className="form-control" required maxLength={200}
               value={form.title} onChange={update("title")} />
      </div>

      <div className="mb-3" style={{ maxWidth: 280 }}>
        <label className="form-label">Date et heure *</label>
        <input type="datetime-local" className="form-control" required
               value={form.scheduled_at} onChange={update("scheduled_at")} />
      </div>

      <div className="mb-3">
        <label className="form-label">Lien pour rejoindre * (Google Meet, Zoom, Jitsi…)</label>
        <input type="url" className="form-control" required placeholder="https://meet.google.com/..."
               value={form.join_url} onChange={update("join_url")} />
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button type="button" className="btn btn-outline-secondary"
                onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
      </div>
    </form>
  );
}

export default function LiveSessionsSection({ courseId, sessions, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState(null);

  const openCreate = () => { setEditing(null); setFormError(""); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setFormError(""); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setFormError(""); };

  const handleSave = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...values, course: courseId };
      if (editing) {
        await api.patch(`/live-sessions/${editing.id}/`, payload);
        setMessage({ type: "success", text: "Session modifiée avec succès." });
      } else {
        await api.post("/live-sessions/", payload);
        setMessage({ type: "success", text: "Session créée avec succès." });
      }
      closeForm();
      await onChanged();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Supprimer la session « ${s.title} » ?`)) return;
    try {
      await api.delete(`/live-sessions/${s.id}/`);
      setMessage({ type: "success", text: "Session supprimée." });
      await onChanged();
    } catch (err) {
      setMessage({ type: "danger", text: errorMessage(err) });
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });

  return (
    <section className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Sessions Live ({sessions.length})</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={openCreate}>+ Programmer un Live</button>
        )}
      </div>

      {message && (
        <div className={`alert alert-${message.type} d-flex justify-content-between`}>
          <span>{message.text}</span>
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      {showForm && (
        <LiveForm
          key={editing ? editing.id : "new"}
          initial={editing}
          onSubmit={handleSave}
          onCancel={closeForm}
          submitting={saving}
          error={formError}
        />
      )}

      {sessions.length === 0 && (
        <div className="text-center text-muted border rounded p-4">
          Aucune session Live programmée.
        </div>
      )}

      <ul className="list-group">
        {sessions.map((s) => {
          const past = new Date(s.scheduled_at) < new Date();
          return (
            <li key={s.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-semibold">
                    {s.title}{" "}
                    {past && <span className="badge text-bg-secondary">Terminée</span>}
                  </div>
                  <div className="small text-muted">{formatDate(s.scheduled_at)}</div>
                  <a href={s.join_url} target="_blank" rel="noreferrer" className="small">
                    Lien du Live
                  </a>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(s)}>
                    Modifier
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s)}>
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}