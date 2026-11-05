import { useState, useEffect } from "react";
import {
  FileText,
  BookOpen,
  Scale,
  Sparkles,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Scan,
} from "lucide-react";

export function EvaluationWorkflow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Student Submits Answer",
      badge: "Step 01",
      icon: Scan,
      color: "blue",
      bgColor: "bg-blue-50 text-primary border-blue-200",
      activeBg: "bg-primary text-white border-primary shadow-md",
      lineColor: "from-blue-600 to-teal-600",
      shortDesc: "Handwritten OCR scan or digital typed submission",
      details: [
        "High-fidelity OCR parsing for handwritten engineering diagrams and equations",
        "Multi-page PDF or live camera capture with instant legibility check",
        "Timestamped cryptographic submission receipt",
      ],
      previewSnippet: "Handwriting OCR Confidence: 98.4% • 3 pages transcribed",
    },
    {
      id: 2,
      title: "AI Retrieves Reference Material",
      badge: "Step 02",
      icon: BookOpen,
      color: "teal",
      bgColor: "bg-teal-50 text-teal border-teal-200",
      activeBg: "bg-teal text-white border-teal shadow-md",
      lineColor: "from-teal-600 to-purple-600",
      shortDesc: "Contextual curriculum standards & model solutions",
      details: [
        "Curated textbook excerpts, lecture slides, and professor model solutions",
        "RAG indexing ensures evaluation grounds only on approved syllabus material",
        "Zero hallucination risk with citation-anchored semantic search",
      ],
      previewSnippet: "Indexed: BEE Unit-3 Transformer Theory (B.L. Theraja Vol II)",
    },
    {
      id: 3,
      title: "Rubric-Based Evaluation",
      badge: "Step 03",
      icon: Scale,
      color: "purple",
      bgColor: "bg-purple-50 text-ai border-purple-200",
      activeBg: "bg-ai text-white border-ai shadow-md",
      lineColor: "from-purple-600 to-amber-500",
      shortDesc: "Criterion-by-criterion deterministic scoring",
      details: [
        "Maps student prose against custom multi-tier rubric criteria",
        "Semantic similarity with mathematical equation syntax matching",
        "Separates conceptual understanding from grammatical fluency",
      ],
      previewSnippet: "Criteria evaluated: Core Principle (4/4), Derivation (4/5), Circuit (2/2)",
    },
    {
      id: 4,
      title: "Marks & Feedback Generated",
      badge: "Step 04",
      icon: Sparkles,
      color: "amber",
      bgColor: "bg-amber-50 text-amber border-amber-200",
      activeBg: "bg-amber text-white border-amber shadow-md",
      lineColor: "from-amber-500 to-orange-600",
      shortDesc: "Explainable rationale with evidence highlights",
      details: [
        "Color-coded highlights: Green (validated concept), Amber (partial), Red (missing)",
        "Missing concept detection with actionable study recommendations",
        "Confidence rating assigned to every individual sub-score",
      ],
      previewSnippet: "AI Suggested: 12.0 / 15.0 • High Confidence (94%)",
    },
    {
      id: 5,
      title: "Teacher Reviews & Approves",
      badge: "Step 05",
      icon: UserCheck,
      color: "orange",
      bgColor: "bg-orange-50 text-teacher border-orange-200",
      activeBg: "bg-teacher text-white border-teacher shadow-md",
      lineColor: "from-orange-600 to-green-600",
      shortDesc: "Faculty oversight with one-click adjustments",
      details: [
        "Side-by-side workbench: Original paper vs AI marked transcript",
        "Full override freedom: Teachers modify scores or add custom marginal notes",
        "Faculty sign-off required before scores reach official student records",
      ],
      previewSnippet: "Faculty Action: Verified by Prof. J. Harrington • Signed & Sealed",
    },
    {
      id: 6,
      title: "Student Receives Approved Result",
      badge: "Step 06",
      icon: CheckCircle2,
      color: "green",
      bgColor: "bg-green-50 text-success border-green-200",
      activeBg: "bg-success text-white border-success shadow-md",
      lineColor: "from-green-600 to-blue-600",
      shortDesc: "Transparent feedback and growth roadmap",
      details: [
        "Complete transparent rationale visible to student with zero ambiguity",
        "Personalized AI learning assistant clarifies any conceptual doubts",
        "Track longitudinal progress and rubric skill mastery across exams",
      ],
      previewSnippet: "Final Score: 13.0 / 15.0 • Grade A • Feedback Published",
    },
  ];

  // Auto-advance through workflow every 4 seconds unless hovered/interacted
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isPaused, steps.length]);

  const current = steps[activeStep];
  const CurrentIcon = current.icon;

  return (
    <div
      className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Workflow Navigation Rail */}
      <div className="relative mb-8">
        {/* Background Connecting Bar */}
        <div className="hidden lg:block absolute top-1/2 left-6 right-6 h-1 -translate-y-1/2 bg-slate-100 dark:bg-slate-800 rounded-full z-0">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-teal-500 to-green-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* 6 Connected Step Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === activeStep;
            const isCompleted = idx < activeStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActiveStep(idx);
                  setIsPaused(true);
                }}
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-200 group text-left ${
                  isActive
                    ? "bg-slate-50 dark:bg-slate-800/90 border-blue-500 shadow-sm ring-2 ring-blue-500/20 scale-[1.02]"
                    : isCompleted
                    ? "bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-900/50 hover:border-slate-300"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 mb-2 ${
                    isActive
                      ? step.activeBg
                      : isCompleted
                      ? "bg-teal-50 dark:bg-teal-950 text-teal border border-teal-200 dark:border-teal-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                  {step.badge}
                </span>
                <span
                  className={`text-xs font-semibold leading-tight line-clamp-2 transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : isCompleted
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Showcase Card */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${current.activeBg}`}>
              <CurrentIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {current.badge} Active
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Step {activeStep + 1} of {steps.length}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {current.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 space-y-2.5">
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              {current.shortDesc}
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {current.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Pipeline State
              </span>
              <span>Explainable AI Engine</span>
            </div>
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed">
              {current.previewSnippet}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Auditable by Faculty</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Standardized & Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
