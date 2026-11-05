import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, Sun, Moon } from "lucide-react";

const portals = [
  {
    name: "Teacher Portal",
    description: "Create assessments and review student submissions.",
    path: "/login/teacher",
    icon: GraduationCap,
    iconClass: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  {
    name: "Student Portal",
    description: "Take assessments and view your results.",
    path: "/login/student",
    icon: BookOpen,
    iconClass: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    name: "Admin Portal",
    description: "Manage users and institutional settings.",
    path: "/login/admin",
    icon: ShieldCheck,
    iconClass: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
];

export function PortalGateway() {
  const { isDark, toggleTheme } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased transition-colors">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">E</span>
            <span className="font-bold text-lg text-slate-900 dark:text-white">EduInfinity</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <section className="mb-14 text-center">
          <p className="mb-4 text-sm font-semibold text-blue-600 dark:text-blue-400">EduInfinity</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Descriptive Answer Evaluation
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Choose your portal to continue.
          </p>
        </section>

        <section aria-label="Access portals" className="grid gap-5 md:grid-cols-3">
          {portals.map(({ name, description, path, icon: Icon, iconClass }) => (
            <article key={path} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
              <Link to={path} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                Continue <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} EduInfinity
      </footer>
    </div>
  );
}
