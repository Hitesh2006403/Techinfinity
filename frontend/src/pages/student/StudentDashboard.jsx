import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examService } from "../../services/examService";
import { useAuth } from "../../context/AuthContext";
import { CountUp } from "../../components/CountUp";
import {
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Award,
  BookOpen,
  Sparkles,
  AlertCircle,
  ScanLine,
  Brain,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await examService.getExams();
      setExams(data);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name || "Aarav"}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
              EE-2024-042
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department of Electrical Engineering • Mid-Term Descriptive Exam Window Active.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/assistant"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-ai dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Concept Assistant</span>
          </Link>
        </div>
      </div>

      {/* Top Overview Count-Up Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Questions</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={1} />
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Q2: Transformer Derivation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Current Score</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={8.0} decimals={1} suffix=" / 10" />
          </div>
          <p className="text-[11px] text-teal font-semibold mt-1">Grade A • Certified by Faculty</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Rubric Criteria Met</span>
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-950 text-success flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={12} suffix=" / 15" />
          </div>
          <p className="text-[11px] text-success font-semibold mt-1">80% Competency Achieved</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Study Clarifications</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-ai flex items-center justify-center">
              <Brain className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={5} />
          </div>
          <p className="text-[11px] text-ai font-semibold mt-1">AI Tutor Concepts Identified</p>
        </div>
      </div>

      {/* Hero Action Card: Active Mid-Term Exam */}
      <div className="bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-600 rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden animate-card-entrance">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 uppercase tracking-wider animate-pulse">
                Action Required
              </span>
              <span className="text-xs font-mono text-slate-400">• Closes in 42 mins</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Basic Electrical Engineering — Mid-Term 2024
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Section B descriptive answering. You may either type your response in the LaTeX-enabled editor or drag-and-drop photographed handwritten ledger sheets for automated OCR recognition.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/student/exam/exam_bee_midterm"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>Resume Question 2</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Status Folio & Published Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5-Phase Submission Tracker Preview (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Submission Pipeline
                </h3>
              </div>
              <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                Phase 3 of 5
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your Question 2 folio has passed OCR optical recognition and is currently being aligned with the syllabus rubric.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 text-xs">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">Handwritten script uploaded (10:14 AM)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">OCR transcription verified (98.4% optical match)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">Provisional AI evaluation in progress</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/student/status"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              <span>View full verification timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Latest Graded Result (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-teal" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Official Certified Folio
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs font-bold">
                Teacher Approved
              </span>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Single-Phase Transformer Derivation
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Evaluated & signed by Prof. J. Harrington</p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl font-mono text-xl font-bold border border-blue-200 dark:border-blue-900">
                8.0 / 10
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-900 dark:text-white block">80% Competency Achieved</span>
                <span>Full marks awarded on Faraday&apos;s Law derivation</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/student/results"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              <span>Inspect marks breakdown & diagnostic notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
