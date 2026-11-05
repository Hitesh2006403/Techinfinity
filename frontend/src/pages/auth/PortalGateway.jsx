import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { EvaluationWorkflow } from "../../components/EvaluationWorkflow";
import { CountUp } from "../../components/CountUp";
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck2,
  Lock,
  ChevronRight,
  Check,
  TrendingUp,
  Scale,
  Brain,
  Sliders,
  Users,
  Compass,
  FileText,
  ScanLine,
} from "lucide-react";

export function PortalGateway() {
  const { isDark, toggleTheme, login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleQuickDemo = async (role) => {
    let email = "j.harrington@oxford.ac.uk";
    let target = "/teacher/dashboard";
    if (role === "student") {
      email = "aarav.sharma@student.institution.edu";
      target = "/student/dashboard";
    } else if (role === "admin") {
      email = "dean.academic@institution.edu";
      target = "/admin/dashboard";
    }

    try {
      const user = await login(email, "demo-password", role);
      showToast(`Signed in as ${user.name} (${role.toUpperCase()})`, "success");
      navigate(target);
    } catch {
      showToast("Demo sign in failed.", "error");
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs group-hover:scale-[1.02] transition-transform">
              <span>E</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  EduInfinity
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  SaaS Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Learn Better. Evaluate Smarter. Grow Beyond Limits.
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection("workflow")}
              className="hover:text-blue-600 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-blue-600 transition-colors"
            >
              Key Features
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="hover:text-blue-600 transition-colors"
            >
              Explainable AI
            </button>
            <button
              onClick={() => scrollToSection("portals")}
              className="hover:text-blue-600 transition-colors"
            >
              Access Portals
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all shadow-xs"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>

            <button
              onClick={() => scrollToSection("portals")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Soft subtle gradient blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 dark:opacity-20 overflow-hidden">
          <div className="absolute -top-12 left-1/4 w-96 h-96 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-teal-200 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-xs mb-6 animate-hero-reveal">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">EduInfinity</span>
            <span className="text-slate-400">•</span>
            <span>Learn Better. Evaluate Smarter. Grow Beyond Limits.</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight animate-hero-reveal">
            Explainable Automated{" "}
            <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
              Descriptive Answer
            </span>{" "}
            Evaluation
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed animate-hero-reveal">
            Empower educators to evaluate open-ended handwritten & typed answers with multi-tier rubrics,
            transparent AI rationales, and full faculty control.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-hero-reveal">
            <button
              onClick={() => scrollToSection("portals")}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm sm:text-base font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => scrollToSection("workflow")}
              className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm sm:text-base font-semibold shadow-xs transition-colors"
            >
              Explore Features & Workflow
            </button>
          </div>

          {/* Social Proof Numbers (Count-Up) */}
          <div className="mt-12 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-center p-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                <CountUp value={82} suffix="%" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Grading Time Saved
              </p>
            </div>
            <div className="text-center p-2 border-l border-slate-100 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                <CountUp value={99.4} decimals={1} suffix="%" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Rubric Alignment
              </p>
            </div>
            <div className="text-center p-2 border-l border-slate-100 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-ai dark:text-purple-400">
                <CountUp value={100} suffix="%" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Explainable Rationale
              </p>
            </div>
            <div className="text-center p-2 border-l border-slate-100 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                <CountUp value={0} suffix="%" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Black-Box Scoring
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Section */}
      <section id="workflow" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-3">
            <Sliders className="w-3.5 h-3.5" />
            <span>Standardized Evaluation Pipeline</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How EduInfinity Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            A fully connected, transparent progression combining high-precision handwriting OCR,
            grounded reference retrieval, deterministic rubrics, and faculty validation.
          </p>
        </div>

        {/* Workflow Component */}
        <EvaluationWorkflow />
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Architected for Academic Rigor</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Purpose-Built for Modern Higher Education
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Traditional multiple-choice tests are limited. EduInfinity makes evaluating complex
              engineering proofs, scientific reasoning, and essay answers scalable and trustworthy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-card-hover transition-all duration-250 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Dynamic Multi-Tier Rubrics
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Construct customized scoring rubrics with real-time mark weight validation. Award
                  sub-marks for formulas, core physical laws, step derivations, and final values.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>Deterministic Grading Rules</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-card-hover transition-all duration-250 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-ai dark:text-purple-400 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Explainable AI Insights
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Zero black-box mystery. Every mark awarded is paired with color-coded textual
                  evidence, detected conceptual errors, and citation back to approved reference answers.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs font-semibold text-ai dark:text-purple-400 flex items-center gap-1">
                <span>Color-Coded Semantic Evidence</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-card-hover transition-all duration-250 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Handwritten & Typed Support
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Students upload physical paper exam answer sheets via drag-and-drop OCR. Teachers review
                  the original handwritten image side-by-side with transcribed mathematical prose.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <span>Side-by-Side Dual Workbench</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits of Explainable AI Section */}
      <section id="benefits" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trust, Rigor & Governance</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Explainable AI Matters in Assessment
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard LLMs cannot be trusted blindly with student grades. EduInfinity enforces
              strict grounding against teacher-provided answer keys and syllabi, making every score auditable.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950 text-green-600 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    100% Faculty Sovereign Control
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    AI provides the baseline; the human educator retains full override rights. AI marks
                    never reach students without faculty sign-off.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Formative Student Growth Roadmaps
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Students don't just see a raw mark—they see exact missing derivations and
                    personalized suggestions from our integrated Learning Assistant.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-ai flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Zero Hallucination with RAG Grounding
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Vectorized textbook chapters and reference marking guidelines prevent external
                    distortions and ensure strict syllabus alignment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Transparent Evaluation Transcript
                </span>
              </div>
              <span className="font-mono text-slate-400">BEE-104 • Q2</span>
            </div>

            <div className="py-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60">
                <div className="flex items-center justify-between text-green-700 dark:text-green-300 font-bold mb-1">
                  <span>[CRITERION 1: FARADAY LAW PRINCIPLE]</span>
                  <span>4.0 / 4.0 PTS</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-sans text-xs">
                  "Candidate accurately enunciated Faraday's second law: e = -N(dΦ/dt) and emphasized
                  mutual magnetic coupling between primary and secondary windings."
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-bold mb-1">
                  <span>[CRITERION 2: EMF EQUATION DERIVATION]</span>
                  <span>3.5 / 5.0 PTS (PARTIAL)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-sans text-xs">
                  "Candidate derived RMS multiplier 4.44 correctly, but omitted explicit sinusoidal flux
                  integration step for average value calculation."
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                <div className="flex items-center justify-between text-ai dark:text-purple-300 font-bold mb-1">
                  <span>[AI INSIGHT & RECOMMENDATION]</span>
                  <span>CONFIDENCE: 94.2%</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-sans text-xs">
                  Suggested Action: Review Theraja Section 32.4 (Derivation of EMF Equation) to solidify
                  time-integral boundaries for periodic sinusoidal waveforms.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Status: Teacher Approved</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">Total: 13.0 / 15.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Portals Section */}
      <section id="portals" className="py-16 sm:py-24 bg-slate-100/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Choose Your Portal</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Three Dedicated Portals for Every Role
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Each stakeholder accesses a purpose-built workspace tailored to their exact workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Teacher Portal Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all duration-250 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950 text-teacher flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
                    Faculty Portal
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Teacher Portal
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                  Design dynamic rubrics, upload question keys, review AI mark suggestions side-by-side
                  with student manuscripts, and track class bell curves.
                </p>

                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Side-by-side OCR review workbench</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Dynamic multi-tier rubric builder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Instant mark override & sign-off</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  to="/login/teacher"
                  className="w-full py-2.5 px-4 bg-teacher hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Teacher Portal Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("teacher")}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Quick Demo (Prof. Harrington)
                </button>
              </div>
            </div>

            {/* Student Portal Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-blue-500 dark:border-blue-600 shadow-md hover:shadow-card-hover transition-all duration-250 flex flex-col justify-between group relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-600 text-white uppercase tracking-wider shadow-xs">
                Most Active
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    Learner Portal
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Student Portal
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                  Submit handwritten answers or typed responses, track real-time evaluation status,
                  inspect transparent grade rationales, and ask the AI tutor questions.
                </p>

                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Drag & drop handwritten OCR upload</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Transparent rubric feedback & highlights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Interactive concept clarification tutor</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  to="/login/student"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Student Portal Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("student")}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Quick Demo (Aarav Sharma)
                </button>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all duration-250 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900">
                    Governance Portal
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Institutional Admin
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                  Manage academic terms, department rosters, user roles, security audits, and institutional
                  evaluation benchmarks across colleges and departments.
                </p>

                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Department & course catalog control</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Faculty & student role provisioning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>System-wide evaluation audit log</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  to="/login/admin"
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Admin Portal Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin")}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Quick Demo (Dean Academic)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Clean Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  E
                </div>
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  EduInfinity
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Explainable Automated Descriptive Answer Evaluation System. Learn Better. Evaluate
                Smarter. Grow Beyond Limits.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>React 19 + Tailwind CSS</span>
                <span>•</span>
                <span>Academic Rigor Compliant</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Portals & Access
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link to="/login/teacher" className="hover:text-blue-600 transition-colors">
                    Teacher Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login/student" className="hover:text-blue-600 transition-colors">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login/admin" className="hover:text-blue-600 transition-colors">
                    Institutional Admin
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-blue-600 transition-colors">
                    Unified Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Evaluation System
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <button onClick={() => scrollToSection("workflow")} className="hover:text-blue-600 transition-colors text-left">
                    6-Step Workflow
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("features")} className="hover:text-blue-600 transition-colors text-left">
                    Dynamic Rubric Engine
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("benefits")} className="hover:text-blue-600 transition-colors text-left">
                    Explainable AI Rationale
                  </button>
                </li>
                <li>
                  <Link to="/register" className="hover:text-blue-600 transition-colors">
                    Register Institution
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} EduInfinity Platform. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">
                Academic Privacy Policy
              </span>
              <span>•</span>
              <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">
                FERPA / Institutional Terms
              </span>
              <span>•</span>
              <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">
                AI Transparency Declaration
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
