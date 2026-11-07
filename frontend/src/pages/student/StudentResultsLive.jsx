import { useEffect, useState } from "react";
import { evaluationService } from "../../services/evaluationService";

function ConceptList({ title, items, tone }) {
  return (
    <div>
      <h4 className={`text-sm font-semibold ${tone}`}>{title}</h4>
      {items?.length ? (
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
        </ul>
      ) : <p className="mt-2 text-sm text-slate-400">None identified.</p>}
    </div>
  );
}

export function StudentResultsLive() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    evaluationService.getStudentResults()
      .then(setSubmissions)
      .catch((err) => setError(err.response?.data?.message || "Results could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading evaluated answer sheets…</div>;
  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;

  const evaluated = submissions.filter((submission) => submission.evaluation);
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <p className="text-xs uppercase tracking-wider text-slate-500">Student portal</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">My evaluated answer sheets</h1>
        <p className="mt-2 text-sm text-slate-500">Marks and feedback are generated from your subject reference material and answer sheet.</p>
      </div>

      {!evaluated.length && <div className="rounded-2xl border border-slate-200 p-8 text-sm text-slate-500">Your answer sheet is still being processed. Refresh this page when evaluation finishes.</div>}

      {evaluated.map((submission) => {
        const evaluation = submission.evaluation;
        return (
          <article key={submission.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">{submission.question_subject}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{submission.question_title}</h2>
                <p className="mt-1 text-sm text-slate-500">Status: {submission.status} · Review: {evaluation.teacher_review_status}</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 px-5 py-3 text-center">
                <p className="text-xs uppercase text-blue-600">Marks</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{evaluation.teacher_approved_marks || evaluation.suggested_marks} <span className="text-base">/ {evaluation.max_marks}</span></p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <ConceptList title="Concepts demonstrated" items={evaluation.concepts_found} tone="text-green-700" />
              <ConceptList title="Concepts to add for full marks" items={evaluation.missing_concepts} tone="text-amber-700" />
              <ConceptList title="Incorrect concepts" items={evaluation.incorrect_concepts} tone="text-red-700" />
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Feedback</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{evaluation.feedback}</p>
            </div>

            {evaluation.question_evaluations?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Question-wise marks</h3>
                {evaluation.question_evaluations.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex justify-between gap-4">
                      <p className="font-medium text-slate-900 dark:text-white">Question {item.question_number}: {item.question_text}</p>
                      <span className="shrink-0 font-semibold">{item.awarded_marks} / {item.maximum_marks}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.feedback}</p>
                    {item.missing_concepts?.length > 0 && <p className="mt-2 text-sm text-amber-700">To improve: {item.missing_concepts.join(", ")}</p>}
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
