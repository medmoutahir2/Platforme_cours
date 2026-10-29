import { useState } from "react";

export default function LessonForm({ initial, defaultPosition, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    video_url: initial?.video_url ?? "",
    position: initial?.position ?? defaultPosition ?? 1,
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      video_url: form.video_url.trim(),
      position: Number(form.position) || 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-4">
      <h3 className="h6 mb-3">{initial ? "Modifier la leçon" : "Nouvelle leçon"}</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <label className="form-label">Titre *</label>
        <input className="form-control" required maxLength={200}
               value={form.title} onChange={update("title")} />
      </div>

      <div className="mb-3">
        <label className="form-label">Description *</label>
        <textarea className="form-control" rows={3} required
                  value={form.description} onChange={update("description")} />
      </div>

      <div className="mb-3">
        <label className="form-label">URL de la vidéo * (YouTube, Vimeo, fichier .mp4…)</label>
        <input type="url" className="form-control" required placeholder="https://..."
               value={form.video_url} onChange={update("video_url")} />
      </div>

      <div className="mb-3" style={{ maxWidth: 160 }}>
        <label className="form-label">Position</label>
        <input type="number" min={1} className="form-control"
               value={form.position} onChange={update("position")} />
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