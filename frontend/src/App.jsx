import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CourseManage from "./pages/CourseManage";
import CourseView from "./pages/CourseView";

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center mt-5">Chargement…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "PROFESSOR" ? "/professor" : "/student"} replace />;
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/professor" element={
            <ProtectedRoute role="PROFESSOR"><ProfessorDashboard /></ProtectedRoute>
          } />
          <Route path="/professor/courses/:id" element={
            <ProtectedRoute role="PROFESSOR"><CourseManage /></ProtectedRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/courses/:id" element={
            <ProtectedRoute role="STUDENT"><CourseView /></ProtectedRoute>
          } />

          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}