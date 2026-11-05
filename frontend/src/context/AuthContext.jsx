import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("eduinfinity_theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("eduinfinity_theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("eduinfinity_theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const login = async (email, password, role) => {
    const data = await authService.login(email, password, role);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const switchRole = (newRole) => {
    const updatedUser = authService.switchRole(newRole);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "teacher",
        isDark,
        toggleTheme,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
