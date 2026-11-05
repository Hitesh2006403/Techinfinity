import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submissionService } from "../../services/submissionService";
import { evaluationService } from "../../services/evaluationService";
import { useToast } from "../../context/ToastContext";
import confetti from "canvas-confetti";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  Info,
  X,
  FileCheck2,
  RotateCcw,
  BookOpen,
  Eye,
  FileText,
  Brain,
} from "lucide-react";

export function TeacherReviewWorkbench() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [submission, setSubmission] = useState(null);
  const [viewMode, setViewMode] = useState("ocr"); // "ocr" | "scan"
  const [teacherScores, setTeacherScores] = useState({
    crit_01: 4.0,
    crit_02: 2.5,
    crit_03: 1.5,
  });
  const [teacherNotes, setTeacherNotes] = useState({
    crit_02: "+0.5 awarded as student noted sinusoidal waveform Phi(t) = Phi_m * sin(omega*t) explicitly.",
  });
  const [feedback, setFeedback] = useState(
    "Good intuitive grasp of induction principles and clean Faraday formulation. Take special care with ideal transformer voltage/turns ratio definitions before final examinations."
  );
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await submissionService.getSubmissionById(id || "subm_aarav_042");
      setSubmission(data);
      if (data?.criteriaEvaluations) {
        const scores = {};
        const notes = {};
        data.criteriaEvaluations.forEach((c) => {
          scores[c.criterionId] = c.teacherScore ?? c.aiScore;
          if (c.teacherNote) notes[c.criterionId] = c.teacherNote;
        });
        setTeacherScores(scores);
        setTeacherNotes(notes);
      }
      if (data?.teacherFeedback) {
        setFeedback(data.teacherFeedback);
      }
    }
    load();
  }, [id]);

  if (!submission) {
    return (
      <div className="p-8 text-center">
        <p className="text-outline animate-pulse">Loading evaluation docket...</p>
      </div>
    );
  }

  // Calculate live total
  const calculatedTotal = Object.values(teacherScores).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  const variance = (calculatedTotal - (submission.aiScore || 7.5)).toFixed(1);

  const handleScoreChange = (criterionId, val, max) => {
    const num = Math.min(Math.max(parseFloat(val) || 0, 0), max);
    setTeacherScores((prev) => ({
      ...prev,
      [criterionId]: num,
    }));
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await evaluationService.saveTeacherReview(submission.id, {
      calculatedTotal,
      teacherFeedback: feedback,
      criteriaEvaluations: submission.criteriaEvaluations.map((c) => ({
        ...c,
        teacherScore: teacherScores[c.criterionId] || c.aiScore,
        teacherNote: teacherNotes[c.criterionId] || "",
      })),
      publish: true,
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast(`Marks (${calculatedTotal.toFixed(1)}/10) officially certified and published!`, "success");
    setIsPublishing(false);
    setTimeout(() => {
      navigate("/teacher/dashboard");
    }, 1500);
  };

  const handleSaveDraft = async () => {
    await evaluationService.saveTeacherReview(submission.id, {
      calculatedTotal,
      teacherFeedback: feedback,
      publish: false,
    });
    showToast("Teacher review draft saved successfully.", "info");
  };

  return (
    <div className="max-w-[1560px] mx-auto grid grid-cols-12 gap-6 items-start pb-20">
      {/* ===================================================================== */}
      {/* LEFT PANEL: Student Submission Evidence (5 Columns)                   */}
      {/* ===================================================================== */}
      <section className="col-span-12 lg:col-span-5 space-y-4">
        {/* Meta Header */}
        <div className="bg-surface-container-lowest dark:bg-primary-container rounded-2xl border border-outline-variant p-4 shadow-folio">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary">
                  Student Answer — {submission.studentName}
                </h1>
                <span className="px-2 py-0.5 rounded-lg bg-academic-green/10 text-academic-green font-mono text-[10px] font-bold border border-academic-green/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  OCR Verified
                </span>
              </div>
              <p className="text-xs text-outline mt-1 font-mono">
                Submitted {submission.submittedAt} • Script ID: {submission.scriptId}
              </p>
            </div>

            {/* View Switcher Toggle */}
            <div className="flex items-center gap-1 bg-surface-container dark:bg-primary p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("ocr")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "ocr"
                    ? "bg-surface-container-lowest dark:bg-primary-container text-primary dark:text-inverse-primary shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Transcribed
              </button>
              <button
                type="button"
                onClick={() => setViewMode("scan")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "scan"
                    ? "bg-surface-container-lowest dark:bg-primary-container text-primary dark:text-inverse-primary shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Scan Sheet
              </button>
            </div>
          </div>

          {/* Question Definition Box */}
          <div className="mt-4 p-3 bg-surface-container-low dark:bg-primary rounded-xl border-l-2 border-primary dark:border-primary-fixed">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-outline font-semibold">
                Question 2 Prompt
              </span>
              <span className="text-xs font-mono font-bold text-primary dark:text-inverse-primary">
                Total: 10 marks
              </span>
            </div>
            <p className="font-headline text-sm leading-snug text-primary dark:text-inverse-primary italic">
              &ldquo;Explain the working principle of a single-phase transformer with core flux relationships and derive the standard EMF equation. Include step-by-step turns ratio logic.&rdquo;
            </p>
          </div>
        </div>

        {/* Paper Transcription Sheet */}
        <div className="bg-surface-container-lowest dark:bg-primary-container rounded-2xl border border-outline-variant p-6 shadow-folio relative overflow-hidden ledger-paper-line min-h-[580px]">
          {viewMode === "scan" ? (
            /* Original Scan Sheet View */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-outline pb-2 border-b border-outline-variant">
                <span>Original Optical Sensor Folio Scan</span>
                <span className="font-mono">Scan DPI: 300</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-outline-variant shadow-sm">
                <img
                  src={submission.handwrittenScanUrl}
                  alt="Student handwriting scan sheet"
                  className="w-full object-cover max-h-[500px]"
                />
              </div>
            </div>
          ) : (
            /* OCR Transcribed View with Stylistic Proofreading Highlights */
            <div className="space-y-5">
              {/* Ledger Top Margin */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-outline-variant text-xs text-outline">
                <span className="font-mono text-[11px]">FOLIO SHEET 02 // CANDIDATE INK RECORD</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-academic-green font-medium">
                    <span className="w-2 h-2 rounded-full bg-academic-green" /> Correct Concept
                  </span>
                  <span className="flex items-center gap-1 text-academic-amber font-medium">
                    <span className="w-2 h-2 rounded-full bg-academic-amber" /> Incomplete
                  </span>
                  <span className="flex items-center gap-1 text-academic-red font-medium">
                    <span className="w-2 h-2 rounded-full bg-academic-red" /> Calculation Error
                  </span>
                </div>
              </div>

              {/* Answer Content */}
              <div className="space-y-4 text-sm leading-relaxed text-on-surface dark:text-inverse-primary">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-outline block mb-1 font-bold">
                    1. OPERATING MECHANISM
                  </span>
                  <p>
                    A transformer is a static machine used to transfer alternating electrical energy from one circuit to another at constant frequency.{" "}
                    <mark className="bg-academic-green/10 text-academic-green dark:text-[#a4f4bc] px-1.5 py-0.5 rounded-md border border-academic-green/30 font-medium">
                      The fundamental operation relies upon Faraday&apos;s law of electromagnetic induction and mutual induction between two magnetically coupled stationary windings.
                    </mark>{" "}
                    When an alternating voltage V₁ is supplied across the primary winding, it sets up an alternating magnetizing current I_μ.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-outline block mb-1 font-bold">
                    2. CORE FLUX PHENOMENOLOGY
                  </span>
                  <p>
                    This exciting current drives a continuous sinusoidal magnetic flux Φ(t) = Φₘ sin(ωt) through the laminated silicon steel core.{" "}
                    <mark className="bg-academic-amber/10 text-academic-amber dark:text-secondary-fixed px-1.5 py-0.5 rounded-md border border-academic-amber/30 font-medium">
                      This magnetic flux travels around the magnetic circuit linking completely with both the primary turns N₁ and secondary turns N₂.
                    </mark>{" "}
                    The core has high permeability μᵣ and offers very low reluctance path to the mutual magnetic lines of force.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-outline block mb-1 font-bold">
                    3. EMF DERIVATION & TURNS RATIO
                  </span>
                  <p>
                    By rate of change of flux linkages, the instantaneous induced electromotive force in the primary is given by e₁ = -N₁ (dΦ/dt) = -N₁ ω Φₘ cos(ωt).
                    Its RMS value is:
                  </p>

                  <div className="my-2 p-3 bg-surface-container-low dark:bg-primary rounded-xl font-mono text-xs border border-outline-variant flex justify-between items-center">
                    <span>E₁ = 4.44 · f · N₁ · Φₘ &nbsp;and&nbsp; E₂ = 4.44 · f · N₂ · Φₘ</span>
                    <span className="text-academic-green font-sans text-xs font-semibold">Valid Derivation</span>
                  </div>

                  <p>
                    Therefore taking the transformation voltage ratio:{" "}
                    <mark className="bg-academic-red/10 text-academic-red dark:text-[#ffdad6] px-1.5 py-0.5 rounded-md border border-academic-red/30 font-medium inline-block mt-1">
                      Step 3: E₂ / E₁ = N₁ / N₂ = K &nbsp;(Hence secondary voltage scales inversed to turns ratio)
                    </mark>
                  </p>
                </div>

                {/* Marginalia Note */}
                <div className="mt-6 p-3.5 bg-surface-container-low dark:bg-primary/50 rounded-xl border-l-4 border-secondary-container dark:border-secondary-fixed shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary dark:text-inverse-primary mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-secondary dark:text-secondary-fixed" />
                    <span>Marginalia Note — OCR Optical Engine</span>
                  </div>
                  <p className="font-headline text-xs text-on-surface-variant dark:text-outline italic">
                    In step 3, handwriting indicates numerator N₁ over N₂ explicitly circled in blue ink on original paper margin. No secondary correction noted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* RIGHT PANEL: Marking Rubric & AI Provisional Review (7 Columns)       */}
      {/* ===================================================================== */}
      <section className="col-span-12 lg:col-span-7 space-y-4">
        {/* Provisional AI Banner */}
        <div className="p-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/70 dark:bg-primary/40 relative">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-secondary-container text-on-secondary-container dark:bg-secondary dark:text-secondary-fixed mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-on-surface dark:text-inverse-primary">
                  Provisional – awaiting teacher review
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-container dark:bg-primary text-outline font-mono text-[10px] uppercase">
                  Model: Claude 3.5 Academic
                </span>
              </div>
              <p className="text-xs text-outline mt-1 leading-relaxed">
                AI provisional scores are algorithmic recommendations derived from syllabus criteria. Final academic authority and grade assignment reside strictly with the teacher.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-mono text-outline block">AI Baseline</span>
              <span className="font-mono text-sm font-bold text-on-surface dark:text-inverse-primary">
                {submission.aiScore || 7.5} / 10
              </span>
            </div>
          </div>
        </div>

        {/* Concept Detection Breakdown with 4 Colored Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-surface-container-lowest dark:bg-primary-container rounded-2xl border border-outline-variant shadow-xs">
          <span className="text-xs font-semibold text-on-surface-variant dark:text-outline">
            Concept Detection Chips:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-green-50 text-success text-xs font-semibold border border-green-200 dark:bg-green-950/40 dark:border-green-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Correct (4)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber text-xs font-semibold border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Needs Clarification (1)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-50 text-error text-xs font-semibold border border-red-200 dark:bg-red-950/40 dark:border-red-800 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Inaccurate (1)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-ai text-xs font-semibold border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              AI Insight (94.2% Conf.)
            </span>
          </div>
        </div>

        {/* Rubric Criteria Cards Container */}
        <div className="space-y-3.5">
          {submission.criteriaEvaluations.map((crit, idx) => {
            const currentScore = teacherScores[crit.criterionId] ?? crit.aiScore;

            return (
              <div
                key={crit.criterionId}
                className="bg-surface-container-lowest dark:bg-primary-container rounded-2xl border border-outline-variant p-4 transition-all hover:border-primary/40 shadow-folio"
              >
                {/* Criterion Header */}
                <div className="flex items-start justify-between pb-3 border-b border-outline-variant/60">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-outline font-bold">
                      RUBRIC CRITERION {idx + 1}
                    </span>
                    <h2 className="font-headline text-base font-semibold text-primary dark:text-inverse-primary mt-0.5">
                      {crit.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Read-only AI Suggested Badge */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-outline block">AI Suggested</span>
                      <span className="px-2 py-0.5 rounded-full border border-dashed border-[#f2d45c] bg-[#f2d45c]/15 text-[#746100] dark:text-secondary-fixed font-mono text-xs font-bold">
                        {crit.aiScore.toFixed(1)} / {crit.maxMarks}
                      </span>
                    </div>

                    <div className="w-px h-8 bg-outline-variant" />

                    {/* Editable Teacher Mark */}
                    <div>
                      <label className="text-[10px] uppercase font-mono text-outline block">Teacher Mark</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={crit.maxMarks}
                          value={currentScore}
                          onChange={(e) => handleScoreChange(crit.criterionId, e.target.value, crit.maxMarks)}
                          className="w-14 h-8 px-2 py-1 text-center font-mono text-sm font-bold bg-surface-container-low dark:bg-primary rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                        />
                        <span className="text-xs text-outline">/ {crit.maxMarks}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Rationale & Teacher Notes */}
                <div className="mt-3 flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    {crit.status === "correct" ? (
                      <Check className="w-4 h-4 text-academic-green" />
                    ) : crit.status === "partial" ? (
                      <Info className="w-4 h-4 text-academic-amber" />
                    ) : (
                      <X className="w-4 h-4 text-academic-red" />
                    )}
                  </div>
                  <div className="text-xs text-on-surface-variant dark:text-outline space-y-1 flex-1">
                    <p>
                      <strong className="text-on-surface dark:text-inverse-primary font-semibold">AI Rationale:</strong>{" "}
                      {crit.aiRationale}
                    </p>
                    {teacherNotes[crit.criterionId] && (
                      <p className="text-secondary dark:text-secondary-fixed italic">
                        <strong>Teacher note:</strong> {teacherNotes[crit.criterionId]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Teacher Feedback Comments Area */}
        <div className="bg-surface-container-lowest dark:bg-primary-container rounded-2xl border border-outline-variant p-4 shadow-folio space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-primary dark:text-inverse-primary flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-outline" />
              Formal Evaluator Commentary
            </label>
            <span className="text-[11px] text-outline">Visible on student ledger report</span>
          </div>

          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-3 bg-surface-container-low dark:bg-primary text-on-surface dark:text-inverse-primary rounded-xl border border-outline-variant font-headline text-sm focus:border-primary focus:outline-none resize-none leading-relaxed"
            placeholder="Add editorial commentary..."
          />

          <div className="flex items-center justify-between text-xs text-outline">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedback((f) => f + " Check transformation ratio definition: E2/E1 = N2/N1.")}
                className="px-2 py-1 rounded-lg bg-surface-container hover:text-on-surface transition-colors"
              >
                Insert standard formula note
              </button>
              <button
                type="button"
                onClick={() => setFeedback((f) => f + " Commendable handwriting clarity.")}
                className="px-2 py-1 rounded-lg bg-surface-container hover:text-on-surface transition-colors"
              >
                + Commend effort
              </button>
            </div>
            <span className="font-mono text-[11px]">Signed: Prof. J. Harrington</span>
          </div>
        </div>

        {/* Sticky Total Score & Final Action Bar */}
        <div className="sticky bottom-4 z-10 bg-surface-container-lowest/95 dark:bg-primary-container/95 rounded-2xl border border-outline-variant p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Highlighter Score Badge */}
            <div className="px-4 py-2 rounded-xl bg-[#f2d45c] text-[#1e2433] shadow-xs flex items-baseline gap-1.5 border border-[#e2c54f]">
              <span className="font-mono text-2xl font-bold tracking-tight">
                {calculatedTotal.toFixed(1)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider font-mono">/ 10 marks</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-primary dark:text-inverse-primary block">
                Final Score (Teacher Overridden)
              </span>
              <span className="text-xs text-outline font-mono">
                {variance >= 0 ? `+${variance}` : variance} variance from AI draft baseline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast("Returned to candidate for correction.", "warning")}
              className="px-3 py-2 border border-outline-variant text-outline hover:text-error hover:border-error/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return</span>
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-2 border border-outline-variant text-on-surface dark:text-inverse-primary rounded-xl text-xs font-semibold hover:bg-surface-container transition-colors"
            >
              Save Draft
            </button>
            <button
              disabled={isPublishing}
              onClick={handlePublish}
              className="px-4 py-2 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isPublishing ? "Publishing..." : "Approve & Publish Result"}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
