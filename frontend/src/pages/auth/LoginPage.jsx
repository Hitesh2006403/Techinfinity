import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Scale,
  Brain,
  Sliders,
} from "lucide-react";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "teacher";

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("j.harrington@oxford.ac.uk");
  const [password, setPassword] = useState("academic-secret-key");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (role === "student") {
      setEmail("aarav.sharma@student.institution.edu");
    } else if (role === "admin") {
      setEmail("dean.academic@institution.edu");
    } else {
      setEmail("j.harrington@oxford.ac.uk");
    }
  }, [role]);

  const validate = () => {
    const errs = {};
    if (!email || !email.includes("@")) {
      errs.email = "Please enter a valid institutional email address";
    }
    if (!password || password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const user = await login(email, password, role);
      showToast(`Welcome back, ${user.name}! Signed in as ${role.toUpperCase()}.`, "success");
      if (role === "student") {
        navigate("/student/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/teacher/dashboard");
      }
    } catch {
      showToast("Authentication failed. Please check your credentials.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased">
      {/* Left Column: Soft Blue-Teal Gradient with EduInfinity Branding & Academic Graphic */}
      <section className="w-full lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-teal-800 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden">
        {/* Subtle decorative glowing shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        {/* Header / Brand */}
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
                Academic Evaluation Suite
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Center Key Graphic & Values */}
        <div className="relative z-10 my-10 lg:my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-teal-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Learn Better. Evaluate Smarter. Grow Beyond Limits.</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Explainable Descriptive Answer Evaluation
          </h2>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed mb-8">
            Grounding AI mark suggestions against teacher-approved rubrics and model solutions.
            Empowering students with transparent feedback and instructors with full editorial agency.
          </p>

          {/* Academic Values List */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Dynamic Multi-Tier Rubrics</h4>
                <p className="text-xs text-blue-100">
                  Granular scoring criteria with deterministic formula and concept checks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-blue-400/20 text-blue-300 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Transparent AI Explanations</h4>
                <p className="text-xs text-blue-100">
                  Color-coded evidence: verified concepts, partial credit, and missing steps.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-teal-400/20 text-teal-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Teacher Sovereign Sign-Off</h4>
                <p className="text-xs text-blue-100">
                  AI assists; human educators hold final approval before scores are published.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-blue-200 pt-6 border-t border-white/10">
          <span>Enterprise Academic Edition</span>
          <span>FERPA & Institutional Privacy Compliant</span>
        </div>
      </section>

      {/* Right Column: Clean White Card for Login Form */}
      <section className="w-full lg:w-1/2 bg-white dark:bg-slate-900 flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative">
        <div className="max-w-[440px] w-full mx-auto my-auto py-6">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Sign In to EduInfinity
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select your academic perspective and enter your credentials to proceed.
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Workspace Portal
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  role === "teacher"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  role === "student"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  role === "admin"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="e.g. j.harrington@oxford.ac.uk"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.email
                      ? "border-red-500 bg-red-50/50"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500"
                  }`}
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast("Password reset instructions dispatched to your email.", "info");
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.password
                      ? "border-red-500 bg-red-50/50"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Keep me signed in on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 group"
              >
                <span>
                  {isLoading
                    ? "Authenticating..."
                    : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400">
          <span>EduInfinity Institutional Security • 256-Bit TLS Encryption</span>
        </div>
      </section>
    </div>
  );
}
