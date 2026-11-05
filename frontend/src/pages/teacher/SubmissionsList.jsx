import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { submissionService } from "../../services/submissionService";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  User
} from "lucide-react";

export function SubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await submissionService.getSubmissions();
      setSubmissions(data);
    }
    load();
  }, []);

  const filtered = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentRoll.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.scriptId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-medium text-primary dark:text-inverse-primary tracking-tight">
            Student Submission Queue
          </h1>
          <p className="text-xs text-outline mt-1">
            Browse examination folios, optical OCR transcriptions, and provisional scoring dockets.
          </p>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate, roll no, or script ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-xl text-xs text-on-surface dark:text-inverse-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-outline">
          <span className="font-mono">{filtered.length} submissions in active roster</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl overflow-hidden shadow-folio">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container dark:bg-primary border-b border-outline-variant uppercase font-mono tracking-wider text-outline text-[11px]">
              <tr>
                <th className="py-3 px-4">Candidate & Roll</th>
                <th className="py-3 px-4">Script ID</th>
                <th className="py-3 px-4">Submission Time</th>
                <th className="py-3 px-4">OCR Status</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Teacher Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filtered.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-surface-container-low/50 dark:hover:bg-primary/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-surface-container-high dark:bg-primary flex items-center justify-center font-bold text-xs text-primary dark:text-inverse-primary border border-outline-variant/60">
                        {sub.studentName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-primary dark:text-inverse-primary">
                          {sub.studentName}
                        </div>
                        <div className="font-mono text-[11px] text-outline">{sub.studentRoll}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{sub.scriptId}</td>
                  <td className="py-3.5 px-4 text-outline">{sub.submittedAt}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-academic-green font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {sub.ocrConfidence || "98.4%"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-outline">
                    {sub.aiScore} / 10
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-[#f2d45c] text-[#1e2433]">
                      {sub.teacherScore || sub.aiScore} / 10
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/teacher/review/${sub.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-xl font-semibold text-primary dark:text-inverse-primary hover:bg-surface-container transition-colors shadow-xs"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
