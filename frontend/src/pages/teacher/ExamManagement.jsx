import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examService } from "../../services/examService";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ArrowRight
} from "lucide-react";

export function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "active" | "marking" | "draft"
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await examService.getExams();
      setExams(data);
    }
    load();
  }, []);

  const filtered = exams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.courseCode.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || e.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-medium text-primary dark:text-inverse-primary tracking-tight">
            Examination Management
          </h1>
          <p className="text-xs text-outline mt-1">
            Author examination blueprints, configure multi-tier rubrics, and monitor live submissions.
          </p>
        </div>
        <Link
          to="/teacher/create-exam"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold shadow-xs hover:bg-primary-hover transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Examination</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by exam name or course code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-xl text-xs text-on-surface dark:text-inverse-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-outline" />
          <div className="flex gap-1 p-1 bg-surface-container-low dark:bg-primary-container rounded-xl border border-outline-variant text-xs">
            {["all", "marking", "active", "draft"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all ${
                  filter === f
                    ? "bg-primary text-white shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((exam) => (
          <div
            key={exam.id}
            className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio flex flex-col justify-between hover:shadow-folio-hover transition-all duration-200"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-surface-container text-primary dark:text-inverse-primary border border-outline-variant">
                  {exam.courseCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    exam.status === "marking"
                      ? "bg-academic-amber/15 text-academic-amber border border-academic-amber/30"
                      : exam.status === "active"
                      ? "bg-academic-green/15 text-academic-green border border-academic-green/30"
                      : "bg-surface-container text-outline"
                  }`}
                >
                  {exam.status}
                </span>
              </div>

              <div>
                <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary leading-snug">
                  {exam.title}
                </h3>
                <p className="text-xs text-outline mt-1">{exam.classroom}</p>
              </div>

              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs text-outline font-mono">
                <span>{exam.totalQuestions} Questions</span>
                <span>{exam.totalMarks} Marks</span>
                <span>{exam.timeLimitMinutes} Mins</span>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-outline">
                  <span>Submissions ({exam.submissionsCount}/{exam.totalEnrolled})</span>
                  <span className="font-mono font-bold">
                    {Math.round((exam.submissionsCount / exam.totalEnrolled) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary dark:bg-primary-fixed h-full rounded-full"
                    style={{ width: `${Math.round((exam.submissionsCount / exam.totalEnrolled) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-outline-variant/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => navigate(`/teacher/review`)}
                className="flex-1 py-1.5 px-3 border border-outline-variant rounded-xl text-xs font-semibold text-primary dark:text-inverse-primary hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Review Folios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/teacher/create-exam`)}
                className="p-1.5 border border-outline-variant rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Edit Rubric"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
