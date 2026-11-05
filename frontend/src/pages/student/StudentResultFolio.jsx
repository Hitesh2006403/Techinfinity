import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { evaluationService } from "../../services/evaluationService";
import { useToast } from "../../context/ToastContext";
import { CountUp } from "../../components/CountUp";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  FileCheck2,
  Sparkles,
  Brain,
  Sliders,
  Scale,
  ArrowRight,
} from "lucide-react";

export function StudentResultFolio() {
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const data = await evaluationService.getStudentResult();
      setResult(data);
    }
    load();
  }, []);

  if (!result) return null;

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb & Header */}
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Official Evaluation Folios</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Electrical Engineering</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-blue-600 dark:text-blue-400 font-semibold">Mid-Term 2024</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {result.examTitle}
          </h1>
          <span className="font-mono text-xs text-slate-400">Exam Ref: BEE-2024-Q02</span>
        </div>
        <p className="text-sm text-slate-500 italic">
          Official Result Docket: Question {result.questionNumber} — {result.questionTitle}
        </p>
      </div>

      {/* Layout Split: Folio & Inspector Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Score Comparison Card */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/60 text-success font-mono text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Teacher Approved
                  </span>
                  <span className="text-xs text-slate-500">
                    Certified by {result.evaluator} on {result.certifiedDate}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.questionTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Applied Rubric: {result.rubricRevision}
                </p>
              </div>

              {/* Score Badges Comparison */}
              <div className="flex items-center gap-3 shrink-0">
                {/* AI Draft Baseline */}
                <div className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
                  <span className="text-[10px] uppercase font-mono font-bold text-ai block">AI Baseline</span>
                  <span className="font-mono text-base font-bold text-slate-700 dark:text-purple-200">
                    7.5 / {result.maxScore}
                  </span>
                </div>

                {/* Final Approved Score */}
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-xl flex flex-col items-center border border-blue-200 dark:border-blue-900 font-mono shadow-xs">
                  <span className="text-[10px] uppercase font-mono font-bold text-blue-600 dark:text-blue-400 block">Final Approved</span>
                  <div className="flex items-baseline gap-1 text-blue-700 dark:text-blue-300">
                    <span className="text-2xl font-extrabold tracking-tight">
                      <CountUp value={result.score} decimals={1} />
                    </span>
                    <span className="text-xs font-bold opacity-80">/ {result.maxScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence & Sovereign Trust Notice */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Explainable AI Audit:</strong> Evaluator approved score with +0.5 mark adjustment for sinusoidal boundary clarity.
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-ai dark:bg-purple-950 dark:text-purple-300 font-mono font-bold text-[11px] shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Confidence: 94.2%</span>
              </div>
            </div>
          </section>

          {/* Color-Coded Chips / Concept Breakdown */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Concept Detection Chips
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-50 text-success border border-green-200 dark:bg-green-950/40 dark:border-green-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Faraday Induction Principle (4/4)
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-50 text-success border border-green-200 dark:bg-green-950/40 dark:border-green-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Silicon Steel Low Reluctance (2/2)
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Sinusoidal Flux Integration (Partial 2.5/3.0)
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-error border border-red-200 dark:bg-red-950/40 dark:border-red-800 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Turns Ratio Formula Inversion (-1.5)
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-ai border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                AI Insight: Review Theraja Vol II §32.4
              </span>
            </div>
          </section>

          {/* Marks by Criterion */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Detailed Rubric Criterion Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {result.criteria.length} Evaluated Criteria
              </span>
            </div>

            <div className="space-y-5">
              {result.criteria.map((c) => (
                <div key={c.number} className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {c.number}. {c.title}
                    </span>
                    <span className="font-mono text-slate-500">
                      <strong className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {c.score.toFixed(1)}
                      </strong>{" "}
                      / {c.maxScore.toFixed(1)} Marks
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(c.score / c.maxScore) * 100}%`,
                        backgroundColor:
                          c.score === c.maxScore
                            ? "#16A34A"
                            : c.score > 0
                            ? "#F59E0B"
                            : "#EF4444",
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    &ldquo;{c.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Diagnostic Review Bento Grid */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Diagnostic Feedback Summary
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Correct (Green) */}
              <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1 rounded-lg bg-green-100 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      What You Got Right
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {result.diagnostic.right}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-green-100 dark:border-green-800/40 flex items-center justify-between text-[11px] font-mono text-success font-bold">
                  <span>Verified Positive</span>
                  <span>+4.0 pts</span>
                </div>
              </div>

              {/* Missing (Amber) */}
              <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1 rounded-lg bg-amber-100 text-amber">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      What Was Missing
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {result.diagnostic.missing}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-800/40 flex items-center justify-between text-[11px] font-mono text-amber font-bold">
                  <span>Omission Notice</span>
                  <span>-0.5 pts</span>
                </div>
              </div>

              {/* Incorrect (Red) */}
              <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1 rounded-lg bg-red-100 text-error">
                      <XCircle className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      What Was Incorrect
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {result.diagnostic.incorrect}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-red-100 dark:border-red-800/40 flex items-center justify-between text-[11px] font-mono text-error font-bold">
                  <span>Calculation Error</span>
                  <span>-1.5 pts</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Teacher Commentary & AI Tutor Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Teacher Commentary
              </h3>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                &ldquo;{result.teacherCommentary}&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="font-bold text-slate-800 dark:text-slate-200">{result.evaluator}</span>
                <span>Oct 24, 2024</span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => showToast("Downloading cryptographically signed PDF folio...", "success")}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Certified PDF Folio</span>
              </button>

              <Link
                to="/assistant"
                className="w-full py-2.5 px-4 rounded-xl border border-purple-200 dark:border-purple-800 text-ai dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Brain className="w-4 h-4" />
                <span>Clarify Concepts with AI Tutor</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
