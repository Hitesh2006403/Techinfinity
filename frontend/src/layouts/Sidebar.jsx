import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileCheck2,
  FileText,
  BarChart3,
  Sparkles,
  Users,
  Settings,
  Moon,
  Sun,
  GraduationCap,
  PlusCircle,
  Clock,
  Layers,
  LogOut,
} from "lucide-react";

export function Sidebar({ isOpen, onClose }) {
  const { user, role, isDark, toggleTheme, switchRole, logout } = useAuth();

  const teacherNav = [
    { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/teacher/exams", label: "Exams", icon: FileText },
    { to: "/teacher/review", label: "Marking & Reviews", icon: FileCheck2, badge: "3" },
    { to: "/teacher/analytics", label: "Results & Analytics", icon: BarChart3 },
    { to: "/teacher/manage", label: "Subjects & RAG", icon: Layers },
    { to: "/assistant", label: "Learning Assistant", icon: Sparkles },
    { to: "/admin/users", label: "Users / Admin", icon: Users },
  ];

  const studentNav = [
    { to: "/student/dashboard", label: "My Folio Dashboard", icon: LayoutDashboard },
    { to: "/student/exams", label: "Assigned Exams", icon: FileText },
    { to: "/student/status", label: "Submission Status", icon: Clock },
    { to: "/student/results", label: "Official Results", icon: FileCheck2 },
    { to: "/assistant", label: "Learning Assistant", icon: Sparkles },
  ];

  const adminNav = [
    { to: "/admin/dashboard", label: "Platform Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/teacher/manage", label: "Subjects & RAG", icon: Layers },
    { to: "/teacher/analytics", label: "System Analytics", icon: BarChart3 },
  ];

  const currentNav = role === "student" ? studentNav : role === "admin" ? adminNav : teacherNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 flex flex-col z-40 bg-surface-container-low dark:bg-primary-container border-r border-outline-variant dark:border-primary-container/60 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
          {/* Header & Nav */}
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-2 py-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary dark:bg-surface-container-lowest text-surface-container-lowest dark:text-primary flex items-center justify-center font-headline text-lg font-bold shadow-xs">
                <span>E</span>
              </div>
              <div>
                <div className="font-headline text-lg font-medium text-primary dark:text-inverse-primary leading-tight">
                  EduInfinity
                </div>
                <div className="text-[11px] font-mono text-outline">Academic Evaluation Folio</div>
              </div>
            </div>

            {/* Quick Action Button for Teacher */}
            {role === "teacher" && (
              <NavLink
                to="/teacher/manage"
                onClick={onClose}
                className="w-full mb-6 flex items-center justify-center gap-2 py-2 px-3 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Subject</span>
              </NavLink>
            )}

            {/* Quick Action Button for Student */}
            {role === "student" && (
              <NavLink
                to="/student/exam/exam_bee_midterm"
                onClick={onClose}
                className="w-full mb-6 flex items-center justify-center gap-2 py-2 px-3 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors shadow-xs"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Take BEE-104 Exam</span>
              </NavLink>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1">
              {currentNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        isActive
                          ? "bg-surface-container-highest dark:bg-primary text-primary dark:text-inverse-primary font-semibold border-l-2 border-primary dark:border-secondary-fixed"
                          : "text-on-surface-variant dark:text-outline hover:text-on-surface dark:hover:text-inverse-primary hover:bg-surface-container dark:hover:bg-primary/50"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-secondary-fixed text-tertiary font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer Controls & User Mini Profile */}
          <div className="pt-4 border-t border-outline-variant/60 dark:border-primary-container/80 space-y-3">
            {/* Role Switcher Pill for Interactive Pair-Programming / Testing */}
            <div className="p-2 bg-surface-container dark:bg-primary rounded-xl border border-outline-variant/60">
              <span className="text-[10px] uppercase font-mono tracking-wider text-outline block mb-1">
                Active Perspective
              </span>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold">
                <button
                  onClick={() => switchRole("teacher")}
                  className={`py-1 rounded-lg transition-colors ${
                    role === "teacher"
                      ? "bg-primary text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Teacher
                </button>
                <button
                  onClick={() => switchRole("student")}
                  className={`py-1 rounded-lg transition-colors ${
                    role === "student"
                      ? "bg-primary text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => switchRole("admin")}
                  className={`py-1 rounded-lg transition-colors ${
                    role === "admin"
                      ? "bg-primary text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container dark:bg-primary">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-outline">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>Appearance</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 bg-surface-container-highest dark:bg-primary-fixed"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    isDark ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Profile & Explicit Sign Out */}
            <div className="p-2.5 rounded-xl bg-surface-container dark:bg-primary border border-outline-variant/60 space-y-2.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary-fixed flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-outline-variant/60">
                  {user?.name?.slice(0, 2).toUpperCase() || "JH"}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-semibold truncate text-on-surface dark:text-inverse-primary">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-outline truncate">{user?.department || "Academic Department"}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors shadow-xs"
                title="Sign out of current session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
