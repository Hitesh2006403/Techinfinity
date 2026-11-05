import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examService } from "../../services/examService";
import { submissionService } from "../../services/submissionService";
import { CountUp } from "../../components/CountUp";
import {
  FileText,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BarChart2,
  Calendar,
  X,
  Sparkles,
  Sliders,
  Scale,
  Brain,
  Award,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const ex = await examService.getExams();
      const subs = await submissionService.getSubmissions();
      setExams(ex);
      setSubmissions(subs);
    }
    loadData();
  }, []);

  const chartData = [
    { band: "0 – 4", students: 4, percentage: 6, fill: "#EF4444" },
    { band: "5 – 6", students: 16, percentage: 24, fill: "#F59E0B" },
    { band: "7 – 8", students: 32, percentage: 47, fill: "#2563EB" },
    { band: "9 – 10", students: 16, percentage: 23, fill: "#16A34A" },
  ];

  return (
    <div className="space-y-6">
      {/* Faculty Sandbox Notice */}
      {!dismissBanner && (
        <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Faculty Evaluation Sandbox Active
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                AI baseline scores generated with syllabus-grounded RAG. You hold sovereign override authority.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmptyDemo(!showEmptyDemo)}
              className="text-xs font-semibold border border-blue-300 dark:border-blue-800 px-3 py-1.5 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors bg-white dark:bg-slate-900 shadow-xs"
            >
              {showEmptyDemo ? "Show Active Dashboard" : "Simulate Empty State"}
            </button>
            <button
              onClick={() => setDismissBanner(true)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good morning, Prof. Harrington
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Term 2 • 2024–2025
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department of Electrical Engineering • Marking window closes in 4 days.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/create-exam"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Exam</span>
          </Link>
        </div>
      </div>

      {/* Top Overview Count-Up Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Needs Review</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950 text-teacher flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={3} />
          </div>
          <p className="text-[11px] text-orange-600 font-semibold mt-1">3 priority student submissions</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Evaluated Papers</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={68} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 3 active course modules</p>
        </div>

        {/* Stat 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Class Average</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={7.4} decimals={1} suffix=" / 10" />
          </div>
          <p className="text-[11px] text-teal font-semibold mt-1">Aligned with dept standard</p>
        </div>

        {/* Stat 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all animate-card-entrance">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">AI Rubric Precision</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-ai flex items-center justify-center">
              <Brain className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={96.8} decimals={1} suffix="%" />
          </div>
          <p className="text-[11px] text-ai font-semibold mt-1">Faculty concordance rate</p>
        </div>
      </div>

      {showEmptyDemo ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 bg-slate-50 dark:bg-slate-800 text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            No active exams yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Create your first examination to invite students, set up automated marking rubrics, and inspect real-time AI scoring folios.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/teacher/create-exam"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create your first exam</span>
            </Link>
            <button
              onClick={() => setShowEmptyDemo(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              Return to Active View
            </button>
          </div>
        </div>
      ) : (
        /* Active Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area Left: "Needs your review" (7 cols) */}
          <section className="lg:col-span-7 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full shadow-sm">
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Needs Your Review
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-orange-100 text-teacher dark:bg-orange-950 dark:text-orange-300">
                      3 pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    High-confidence AI drafted annotations awaiting professor sign-off or decision.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900"
                    title="Filter Queue"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submissions Queue List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 flex flex-col justify-start">
                {submissions.slice(0, 3).map((sub) => {
                  const isReviewed = sub.status === "teacher_reviewed";
                  const isFlagged = sub.aiScore < 7.0;

                  return (
                    <div
                      key={sub.id}
                      className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {sub.studentName}
                          </span>
                          <span className="font-mono text-xs text-slate-400">({sub.studentRoll})</span>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">Basic Electrical Engineering</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {sub.submittedAt}
                          </span>
                          <span>•</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-tight ${
                              isReviewed
                                ? "bg-green-50 text-success border border-green-200 dark:bg-green-950/50 dark:border-green-800"
                                : isFlagged
                                ? "bg-orange-50 text-teacher border border-orange-200 dark:bg-orange-950/50 dark:border-orange-800"
                                : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800"
                            }`}
                          >
                            {isReviewed
                              ? `Reviewed (${sub.teacherScore}/10)`
                              : isFlagged
                              ? "Needs Teacher Decision"
                              : `AI Draft Ready (${sub.aiScore}/10)`}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2 shrink-0">
                        <button
                          onClick={() => navigate(`/teacher/review/${sub.id}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
                        >
                          <span>Review Workbench</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-mono text-slate-400">
                          {isFlagged ? "Ambiguous step in Q3 proof" : "Rubric Q1–Q4 auto-mapped"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Showing priority queue based on submission timestamps</span>
                <Link
                  to="/teacher/submissions"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all 14 marked items →
                </Link>
              </div>
            </div>
          </section>

          {/* Main Area Right: Active Exams + Class Performance (5 cols) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            {/* Active Exams Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upcoming & Active Exams
                </h3>
                <span className="text-xs font-mono text-slate-400">3 Recorded</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1">
                {exams.slice(0, 3).map((exam) => (
                  <div key={exam.id} className="py-3.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {exam.title}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          exam.status === "marking"
                            ? "bg-orange-50 text-teacher dark:bg-orange-950 dark:text-orange-300"
                            : exam.status === "active"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        {exam.status === "marking" ? "Due Today" : exam.status === "active" ? "Active" : "Draft"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                        <span>{exam.submissionsCount}/{exam.totalEnrolled} submissions</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {Math.round((exam.submissionsCount / exam.totalEnrolled) * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((exam.submissionsCount / exam.totalEnrolled) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Performance Summary with Recharts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Class Performance Summary
                  </h3>
                  <p className="text-xs text-slate-500">Aggregated grade spread across 68 graded papers</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Class Average</span>
                  <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    7.4 / 10
                  </span>
                </div>
              </div>

              {/* Recharts Bar Chart */}
              <div className="pt-4 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="band" tick={{ fontSize: 11, fill: "#64748B" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-md">
                              <p className="font-bold text-slate-900 dark:text-white">{data.band} Marks</p>
                              <p className="text-slate-500">{data.students} students ({data.percentage}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-teal font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Bell curve aligned with departmental standard
                </span>
                <Link to="/teacher/analytics" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Full Analytics →
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
