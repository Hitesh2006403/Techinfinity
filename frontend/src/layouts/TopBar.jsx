import { Menu, ChevronRight, User, Bell, HelpCircle, ArrowLeft, ArrowRight, CheckCheck, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export function TopBar({ onOpenSidebar }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isWorkbench = location.pathname.includes("/teacher/review");
  const isExam = location.pathname.includes("/student/exam");

  const handleQuickPublish = () => {
    showToast("All evaluated folios published to official student ledgers!", "success");
  };

  const handleQuickDraft = () => {
    showToast("Examination draft progress saved safely.", "info");
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-14 bg-surface-container-lowest dark:bg-primary-container border-b border-outline-variant/60 z-20 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 -ml-1 text-on-surface-variant hover:text-on-surface rounded-lg md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-outline truncate">
          <span className="font-semibold text-primary dark:text-inverse-primary truncate">
            {role === "student" ? "Student Examination Portal" : "Basic Electrical Engineering"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-outline" />
          <span className="hidden sm:inline-block font-mono truncate">
            {isWorkbench ? "Q2: Transformer Induction Principle" : isExam ? "Mid-Term 2024" : "Academic Folio v2.4"}
          </span>

          {isWorkbench && (
            <>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-outline hidden sm:block" />
              <div className="hidden md:flex items-center gap-1.5 bg-surface-container dark:bg-primary px-2 py-0.5 rounded-lg text-primary dark:text-inverse-primary font-medium shrink-0 border border-outline-variant/60">
                <User className="w-3 h-3 text-academic-green" />
                <span>Aarav Sharma</span>
                <span className="font-mono text-[10px] text-outline">(EE-2024-042)</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions, Student Pagination & Icons */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {isWorkbench && (
          <>
            {/* Student Pagination */}
            <div className="hidden lg:flex items-center border border-outline-variant rounded-lg divide-x divide-outline-variant">
              <button
                className="px-2 py-1 text-on-surface-variant hover:bg-surface-container transition-colors"
                title="Previous Student"
                onClick={() => showToast("Loaded Candidate #13 (Marcus Chen)", "info")}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 py-1 text-xs font-mono font-medium text-on-surface">14 / 68</span>
              <button
                className="px-2 py-1 text-on-surface-variant hover:bg-surface-container transition-colors"
                title="Next Student"
                onClick={() => showToast("Loaded Candidate #15 (Elena Rostova)", "info")}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleQuickDraft}
              className="hidden sm:inline-block px-3 py-1.5 border border-outline-variant rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              Save Draft
            </button>

            <button
              onClick={handleQuickPublish}
              className="px-3 py-1.5 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Publish Marks</span>
            </button>
          </>
        )}

        <div className="flex items-center gap-1.5 pl-2 border-l border-outline-variant text-outline">
          <button
            onClick={() => showToast("3 pending student submissions require your evaluation sign-off.", "info")}
            className="p-1.5 hover:text-on-surface rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-primary-container" />
          </button>
          <button
            onClick={() => navigate("/assistant")}
            className="p-1.5 hover:text-on-surface rounded-lg transition-colors"
            title="AI Learning Assistant"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Explicit Sign Out in TopBar */}
          <button
            type="button"
            onClick={logout}
            className="ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 transition-colors shadow-xs"
            title="Sign out of current portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
