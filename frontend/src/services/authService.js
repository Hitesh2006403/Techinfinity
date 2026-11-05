import api from "./api";
import { INITIAL_USER, MOCK_STUDENT_USER, MOCK_ADMIN_USER } from "../utils/mockData";

export const authService = {
  async login(email, password, role = "teacher") {
    try {
      const response = await api.post("/auth/login/", { email, password, role });
      if (response.data.token) {
        localStorage.setItem("eduinfinity_token", response.data.token);
      }
      return response.data;
    } catch {
      // Mock Fallback
      let user = INITIAL_USER;
      if (role === "student" || email?.includes("student")) {
        user = MOCK_STUDENT_USER;
      } else if (role === "admin" || email?.includes("dean") || email?.includes("admin")) {
        user = MOCK_ADMIN_USER;
      }
      localStorage.setItem("eduinfinity_user", JSON.stringify(user));
      localStorage.setItem("eduinfinity_token", "mock_jwt_token_" + user.role);
      return { token: "mock_jwt_token_" + user.role, user };
    }
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
