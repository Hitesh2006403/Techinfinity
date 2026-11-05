import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  Award,
  ArrowLeft,
  FileCheck2,
  Info,
  ShieldCheck,
  Eye
} from "lucide-react";

export function SubmissionStatusPage() {
  const { showToast } = useToast();

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center pb-16">
      {/* Secondary Navigation Anchor */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-primary dark:hover:text-inverse-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to my exams</span>
        </Link>
        <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
          Exam Docket #EE-9481
        </span>
      </div>

      {/* Notebook-Inspired Status Folio Card */}
      <div className="w-full bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl overflow-hidden shadow-folio">
        {/* Folio Header */}
        <div className="px-6 sm:px-8 pt-7 pb-6 border-b border-outline-variant/60 relative bg-surface-container-low/40 dark:bg-primary/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary dark:bg-primary-fixed" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-secondary dark:text-secondary-fixed font-bold">
                  Evaluation Pipeline
                </span>
                <span className="text-outline">•</span>
                <span className="text-[11px] font-mono text-outline">Archival Record</span>
              </div>
              <h1 className="font-headline text-2xl font-medium text-primary dark:text-inverse-primary tracking-tight">
                Submission Status & Verification
              </h1>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-outline-variant font-mono text-xs text-on-surface">
              <Clock className="w-3.5 h-3.5 text-outline" />
              <span>Recorded 10:14 AM</span>
            </div>
          </div>
        </div>

        {/* Timeline Canvas */}
        <div className="px-6 sm:px-10 py-8 ledger-paper-line">
          <div className="relative">
            {/* Continuous Line */}
            <div className="absolute left-4 sm:left-5 top-5 bottom-6 w-[2px] bg-outline-variant/60 -translate-x-1/2" />

            <div className="space-y-7 relative">
              {/* Step 1: Submitted (Completed) */}
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="relative z-10 w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-academic-green/10 border border-academic-green/30 flex items-center justify-center shrink-0 text-academic-green">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-base font-semibold text-primary dark:text-inverse-primary">
                        Submitted
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-academic-green/10 text-academic-green font-mono text-[10px] font-bold border border-academic-green/20">
                        Completed
                      </span>
                    </div>
                    <span className="font-mono text-xs text-outline bg-surface px-2 py-0.5 rounded border border-outline-variant/60">
                      10:14 AM
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-outline">
                    Files and OCR text safely uploaded.
                  </p>
                </div>
              </div>

              {/* Step 2: Reading handwriting (Completed) */}
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="relative z-10 w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-academic-green/10 border border-academic-green/30 flex items-center justify-center shrink-0 text-academic-green">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-base font-semibold text-primary dark:text-inverse-primary">
                        Reading your handwriting
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-academic-green/10 text-academic-green font-mono text-[10px] font-bold border border-academic-green/20">
                        Completed
                      </span>
                    </div>
                    <span className="font-mono text-xs text-outline bg-surface px-2 py-0.5 rounded border border-outline-variant/60">
                      10:15 AM
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-outline">
                    Scanned folio transcribed with 98.4% optical confidence.
                  </p>
                </div>
              </div>

              {/* Step 3: Being evaluated (In Progress) */}
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="relative z-10 w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-[#ffe16d]/50 border border-secondary/40 flex items-center justify-center shrink-0 text-secondary">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 pt-0.5 bg-surface-container-low/60 dark:bg-primary/40 p-3.5 rounded-xl border border-secondary/30">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-base font-semibold text-primary dark:text-inverse-primary">
                        Being evaluated
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-secondary-fixed text-tertiary font-mono text-[10px] font-bold border border-secondary/30">
                        In Progress
                      </span>
                    </div>
                    <span className="font-mono text-xs text-secondary font-bold bg-surface px-2 py-0.5 rounded border border-secondary/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      In progress
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface dark:text-inverse-primary">
                    AI analyzing Faraday&apos;s law concepts against teacher rubric.
                  </p>
                </div>
              </div>

              {/* Step 4: Teacher review (Upcoming) */}
              <div className="flex items-start gap-4 sm:gap-6 opacity-75">
                <div className="relative z-10 w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center shrink-0 text-outline">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-base font-medium text-outline">
                        Teacher review
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-outline font-mono text-[10px]">
                        Upcoming
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-outline italic">Pending step 3</span>
                  </div>
                  <p className="mt-1 text-xs text-outline">
                    Assigned to Prof. Harrington for definitive grading.
                  </p>
                </div>
              </div>

              {/* Step 5: Result published (Upcoming) */}
              <div className="flex items-start gap-4 sm:gap-6 opacity-60">
                <div className="relative z-10 w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center shrink-0 text-outline">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-base font-medium text-outline">
                        Result published
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-outline font-mono text-[10px]">
                        Upcoming
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-outline italic">Final phase</span>
                  </div>
                  <p className="mt-1 text-xs text-outline">
                    Final official mark published to student ledger.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reassuring Editorial Callout */}
          <div className="mt-10 p-4 rounded-xl bg-surface-container-low dark:bg-primary/50 border border-outline-variant flex items-start gap-3">
            <Info className="w-5 h-5 text-primary dark:text-inverse-primary shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface dark:text-inverse-primary leading-relaxed">
              <strong className="font-semibold text-primary dark:text-inverse-primary">What happens next:</strong> Your instructor reviews the preliminary concepts before any score is finalized. No action is required from you.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-surface-container-low/60 dark:bg-primary/40 border-t border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-outline font-mono">
            <ShieldCheck className="w-4 h-4 text-academic-green" />
            <span>Encrypted cryptographic checksum valid</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/student/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface border border-outline-variant hover:bg-surface transition-colors"
            >
              Back to my exams
            </Link>
            <button
              onClick={() => showToast("Opening scanned archival folio copy...", "info")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary dark:bg-primary-fixed text-white dark:text-primary text-xs font-semibold hover:bg-primary-hover transition-colors shadow-xs"
            >
              <Eye className="w-4 h-4" />
              <span>View submitted file copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
