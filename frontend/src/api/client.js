import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("user");
  const method = (config.method || "").toLowerCase();
  const requiresAuth = ["post", "put", "patch", "delete"].includes(method);
  const url = config.url || "";

  // Auth endpoints must be callable without an existing token.
  const isPublicAuth =
    method === "post" &&
    (url === "/auth/login" ||
      url === "/auth/signup" ||
      url === "/auth/bootstrap-admin");

  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed?.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
      return config;
    }
  }

  if (requiresAuth && !isPublicAuth) {
    window.location.href = "/login";
    throw new axios.Cancel("Auth required");
  }

  return config;
});

export default api;
