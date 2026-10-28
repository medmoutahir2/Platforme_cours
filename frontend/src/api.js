import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

// Kat7awl les erreurs DRF l message mfhoum (bla erreur technique brute)
export function errorMessage(err) {
  if (!err.response) return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  const { status, data } = err.response;
  if (status >= 500) return "Une erreur est survenue. Réessayez dans un instant.";
  if (status === 403) return data?.detail || "Action non autorisée.";
  if (typeof data === "string") return "Une erreur est survenue.";
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const msgs = Object.values(data).flat().filter((m) => typeof m === "string");
    if (msgs.length) return msgs.join(" ");
  }
  return "Une erreur est survenue.";
}

export default api;