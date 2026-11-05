import { useState, useEffect } from "react";
import { examService } from "../../services/examService";
import { useToast } from "../../context/ToastContext";
import {
  Layers,
  Users,
  BookOpen,
  PlusCircle,
  MoreVertical,
  CheckCircle2
} from "lucide-react";

export function SubjectClassroomManagement() {
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const subs = await examService.getSubjects();
      const cls = await examService.getClassrooms();
      setSubjects(subs);
      setClassrooms(cls);
    }
    load();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-medium text-primary dark:text-inverse-primary tracking-tight">
            Curriculum & Classroom Rosters
          </h1>
          <p className="text-xs text-outline mt-1">
            Configure departmental courses, student cohorts, and assignment enrollments.
          </p>
        </div>
        <button
          onClick={() => showToast("Subject & Classroom creation modal initialized.", "info")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold shadow-xs hover:bg-primary-hover transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Course / Cohort</span>
        </button>
      </div>

      {/* Subjects Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary dark:text-inverse-primary" />
          <h2 className="font-headline text-xl font-medium text-primary dark:text-inverse-primary">
            Registered Subjects
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-primary dark:text-inverse-primary border border-outline-variant">
                  {sub.code}
                </span>
                <span className="text-xs text-outline font-mono">{sub.credits} Credits</span>
              </div>
              <div>
                <h3 className="font-headline text-base font-semibold text-primary dark:text-inverse-primary leading-tight">
                  {sub.name}
                </h3>
                <p className="text-xs text-outline mt-1">{sub.department}</p>
              </div>
              <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-outline">
                <span className="flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5" />
                  {sub.studentsEnrolled} Students
                </span>
                <span className="text-academic-green font-semibold">Active Roster</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Classrooms / Cohorts Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary dark:text-inverse-primary" />
          <h2 className="font-headline text-xl font-medium text-primary dark:text-inverse-primary">
            Classroom Cohorts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <div
              key={cls.id}
              className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio space-y-4"
            >
              <div>
                <h3 className="font-headline text-lg font-semibold text-primary dark:text-inverse-primary">
                  {cls.name}
                </h3>
                <p className="text-xs text-outline mt-0.5">{cls.subject}</p>
              </div>

              <div className="p-3 bg-surface-container-low dark:bg-primary rounded-xl border border-outline-variant flex items-center justify-between text-xs font-mono">
                <span>Capacity: {cls.capacity} Seats</span>
                <span className="font-bold text-academic-green">{cls.activeExams} Active Exam</span>
              </div>

              <button
                onClick={() => showToast(`Roster for ${cls.name} opened.`, "info")}
                className="w-full py-2 border border-outline-variant rounded-xl text-xs font-semibold text-primary dark:text-inverse-primary hover:bg-surface-container transition-colors"
              >
                View Enrolled Student Roster
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
