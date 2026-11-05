import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Scale,
  Brain,
  Sliders,
  Mail,
  Lock,
} from "lucide-react";

export function TeacherLoginPage() {
  const [email, setEmail] = useState("j.harrington@oxford.ac.uk");
  const [password, setPassword] = useState("academic-secret-key");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password, "teacher");
      showToast(`Welcome back, ${user.name}! Faculty Session Initiated.`, "success");
      navigate("/teacher/dashboard");
    } catch {
      showToast("Faculty authentication failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("j.harrington@oxford.ac.uk");
    setPassword("academic-secret-key");
    showToast("Filled Prof. J. Harrington credentials.", "info");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased">
      {/* Left Column: Soft Blue-Teal Gradient */}
      <section className="w-full lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-teal-800 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold text-2xl shadow-sm group-hover:scale-105 transition-transform">
              <span>E</span>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white block">
                EduInfinity
              </span>
              <span className="text-xs text-blue-200 block font-medium">
                Faculty Evaluation Workbench
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Portals</span>
          </Link>
        </div>

        {/* Center Graphic & Values */}
        <div className="relative z-10 my-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-teal-200 mb-4">
            <GraduationCap className="w-3.5 h-3.5 text-teal-300" />
            <span>Learn Better. Evaluate Smarter. Grow Beyond Limits.</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Teacher Evaluation Portal
          </h2>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed mb-6">
            Review AI mark suggestions side-by-side with student manuscripts, customize scoring rubrics,
            and maintain full sovereignty over published student marks.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Full Override Authority</h4>
                <p className="text-xs text-blue-100">
                  Override AI suggestions with a single click. Adjust points or add faculty notes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Dynamic Rubric Builder</h4>
                <p className="text-xs text-blue-100">
                  Define complex marking criteria with automatic live point validation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-blue-200 pt-6 border-t border-white/10">
          <span>Faculty Portal Active</span>
          <span>Syllabus-Grounded Assessment</span>
        </div>
      </section>

      {/* Right Column: Clean White Card */}
      <section className="w-full lg:w-1/2 bg-white dark:bg-slate-900 flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative">
        <div className="max-w-[440px] w-full mx-auto my-auto py-6">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
              Teacher / Faculty Portal
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Fill Demo Faculty
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Faculty Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            Sign in to access your course grading queues, rubrics, and analytics.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Faculty Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. j.harrington@oxford.ac.uk"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast("Password reset link sent to faculty email.", "info");
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Remember me on this workstation</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 group"
              >
                <span>{isLoading ? "Signing in..." : "Enter Faculty Workbench"}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Switch to:</span>
            <div className="flex gap-3">
              <Link to="/login/student" className="text-blue-600 dark:text-blue-400 hover:underline">
                Student Portal
              </Link>
              <span>•</span>
              <Link to="/login/admin" className="text-teal-600 dark:text-teal-400 hover:underline">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          <span>EduInfinity Institutional Security • Faculty Session</span>
        </div>
      </section>
    </div>
  );
}
