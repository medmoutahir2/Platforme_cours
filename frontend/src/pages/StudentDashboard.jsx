import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="container mt-5">
      <h1 className="h3">Espace Étudiant</h1>
      <p>Bienvenue {user.first_name} 👋</p>
      <button className="btn btn-outline-secondary" onClick={logout}>Se déconnecter</button>
    </div>
  );
}