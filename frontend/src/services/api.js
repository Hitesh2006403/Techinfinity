import axios from "axios";

// Central Axios instance using environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to attach Django token-auth credentials.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("eduinfinity_token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with graceful error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and handle session expiry gracefully
      console.warn("Session expired or unauthorized request");
    }
    return Promise.reject(error);
  }
);

export default api;
