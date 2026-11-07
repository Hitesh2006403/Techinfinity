import api from "./api";
import { INITIAL_USER, MOCK_STUDENT_USER, MOCK_ADMIN_USER } from "../utils/mockData";

export const authService = {
  async getStudents() {
    const response = await api.get("/auth/students/");
    return response.data?.data?.students || [];
  },
  async login(email, password, role = "teacher") {
    const response = await api.post("/auth/login/", { email, password, role });
    const payload = response.data?.data || response.data;
    if (payload.token) {
      localStorage.setItem("eduinfinity_token", payload.token);
    }
    if (payload.user) {
      localStorage.setItem("eduinfinity_user", JSON.stringify(payload.user));
    }
    return payload;
  },

  getCurrentUser() {
    const saved = localStorage.getItem("eduinfinity_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USER;
      }
    }
    return INITIAL_USER;
  },

  switchRole(role) {
    let user = INITIAL_USER;
    if (role === "student") user = MOCK_STUDENT_USER;
    if (role === "admin") user = MOCK_ADMIN_USER;
    if (role === "teacher") user = INITIAL_USER;

    localStorage.setItem("eduinfinity_user", JSON.stringify(user));
    localStorage.setItem("eduinfinity_token", "mock_jwt_token_" + role);
    return user;
  },

  logout() {
    localStorage.removeItem("eduinfinity_token");
    localStorage.removeItem("eduinfinity_user");
  }
};
