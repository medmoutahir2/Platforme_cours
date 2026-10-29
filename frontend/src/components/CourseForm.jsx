import { useState } from "react";

export default function CourseForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      cover_image_url: form.cover_image_url.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-4">
      <h2 className="h5 mb-3">{initial ? "Modifier le cours" : "Nouveau cours"}</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <label className="form-label">Titre *</label>
        <input className="form-control" required maxLength={200}
               value={form.title} onChange={update("title")} />
      </div>

      <div className="mb-3">
        <label className="form-label">Description *</label>
        <textarea className="form-control" rows={4} required
                  value={form.description} onChange={update("description")} />
      </div>

      <div className="mb-3">
        <label className="form-label">Image de couverture (URL, optionnel)</label>
        <input type="url" className="form-control" placeholder="https://..."
               value={form.cover_image_url} onChange={update("cover_image_url")} />
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