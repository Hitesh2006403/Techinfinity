import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  User,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Building2,
  Scale,
  Brain,
} from "lucide-react";

export function RegisterPage() {
  const [role, setRole] = useState("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = "Please enter your full academic name";
    if (!email || !email.includes("@")) errs.email = "Please enter a valid academic email address";
    if (!department.trim()) errs.department = "Department or class identifier required";
    if (!password || password.length < 6) errs.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!agreeTerms) errs.agreeTerms = "You must accept the academic integrity policy";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Simulate registration & auto-login
      const user = await login(email, password, role);
      showToast(`Account successfully registered! Welcome, ${fullName || user.name}.`, "success");
      if (role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/teacher/dashboard");
      }
    } catch {
      showToast("Account registration failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased">
      {/* Left Column: Soft Blue-Teal Gradient with EduInfinity Branding & Academic Graphic */}
      <section className="w-full lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-teal-800 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden">
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
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>

        {/* Center Graphic & Values */}
        <div className="relative z-10 my-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-teal-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Join 40+ Higher Education Institutions</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Create Your Academic Account
          </h2>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed mb-6">
            Get instant access to AI-assisted rubric evaluation, transparent feedback,
            and personalized improvement tracking.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Full Transparency</h4>
                <p className="text-xs text-blue-100">
                  Inspect every point awarded with direct references to syllabus rubrics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-blue-400/20 text-blue-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Academic Integrity Verified</h4>
                <p className="text-xs text-blue-100">
                  Encrypted handwritten submissions and certified faculty review logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-blue-200 pt-6 border-t border-white/10">
          <span>EduInfinity Institutional Cloud</span>
          <span>Learn Better. Evaluate Smarter.</span>
        </div>
      </section>

      {/* Right Column: Clean White Card for Registration Form */}
      <section className="w-full lg:w-1/2 bg-white dark:bg-slate-900 flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative">
        <div className="max-w-[440px] w-full mx-auto my-auto py-6">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Register Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Create an institutional profile to begin submitting or moderating answers.
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              I am registering as:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
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
                onClick={() => setRole("teacher")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  role === "teacher"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Faculty / Teacher
              </button>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance or Aarav Sharma"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.fullName
                      ? "border-red-500 bg-red-50/50"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500"
                  }`}
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
              </div>
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.email
                      ? "border-red-500 bg-red-50/50"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500"
                  }`}
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Department / Class */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department / Program
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Electrical Engineering / Class of 2026"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.department
                      ? "border-red-500 bg-red-50/50"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500"
                  }`}
                  required
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
              </div>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}

            {/* Academic Honor Code Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>
                  I agree to the Institutional Academic Integrity Policy and terms of evaluation
                  governance.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-500 mt-1">{errors.agreeTerms}</p>}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 group"
              >
                <span>{isLoading ? "Creating Profile..." : "Complete Registration"}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>

          {/* Sign In link */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          <span>EduInfinity Institutional Security • Encrypted Registration</span>
        </div>
      </section>
    </div>
  );
}
