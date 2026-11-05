import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examService } from "../../services/examService";
import {
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  Search,
  BookOpen
} from "lucide-react";

export function AssignedExamsList() {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await examService.getExams();
      setExams(data);
    }
    load();
  }, []);

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.courseCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-medium text-primary dark:text-inverse-primary tracking-tight">
            Assigned Examinations
          </h1>
          <p className="text-xs text-outline mt-1">
            Registered examination folios, timed assessments, and published results.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search assigned exam or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-xl text-xs text-on-surface dark:text-inverse-primary focus:outline-none focus:border-primary"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((exam) => {
          const isMidterm = exam.id === "exam_bee_midterm";

          return (
            <div
              key={exam.id}
              className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio flex flex-col justify-between hover:shadow-folio-hover transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-surface-container text-primary dark:text-inverse-primary border border-outline-variant">
                    {exam.courseCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isMidterm
                        ? "bg-error/15 text-error"
                        : exam.status === "active"
                        ? "bg-academic-green/15 text-academic-green"
                        : "bg-surface-container text-outline"
                    }`}
                  >
                    {isMidterm ? "In Progress" : exam.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary leading-snug">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-outline mt-1">{exam.classroom}</p>
                </div>

                <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs font-mono text-outline">
                  <span>{exam.totalQuestions} Questions</span>
                  <span>{exam.totalMarks} Marks</span>
                  <span>{exam.timeLimitMinutes} Mins</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-outline-variant/60">
                {isMidterm ? (
                  <Link
                    to={`/student/exam/${exam.id}`}
                    className="w-full py-2 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold hover:bg-primary-hover flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Resume Answering</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 bg-surface-container text-outline rounded-xl text-xs font-semibold cursor-not-allowed"
                  >
                    Scheduled for {exam.dueDate}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
