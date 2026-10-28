import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "", role: "STUDENT",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === "PROFESSOR" ? "/professor" : "/student", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h1 className="h3 mt-5 mb-4 text-center">Créer un compte</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="row">
          <div className="col mb-3">
            <label className="form-label">Prénom</label>
            <input className="form-control" required value={form.first_name} onChange={update("first_name")} />
          </div>
          <div className="col mb-3">
            <label className="form-label">Nom</label>
            <input className="form-control" required value={form.last_name} onChange={update("last_name")} />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" required value={form.email} onChange={update("email")} />
        </div>
        <div className="mb-3">
          <label className="form-label">Mot de passe (8 caractères minimum)</label>
          <input type="password" className="form-control" required minLength={8}
                 value={form.password} onChange={update("password")} />
        </div>
        <div className="mb-3">
          <label className="form-label">Je suis</label>
          <select className="form-select" value={form.role} onChange={update("role")}>
            <option value="STUDENT">Étudiant</option>
            <option value="PROFESSOR">Professeur</option>
          </select>
        </div>
        <button className="btn btn-primary w-100" disabled={submitting}>
          {submitting ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="text-center mt-3">
        Déjà inscrit ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}