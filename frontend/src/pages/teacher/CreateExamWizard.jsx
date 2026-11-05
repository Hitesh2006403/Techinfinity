import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { examService } from "../../services/examService";
import { useToast } from "../../context/ToastContext";
import {
  Check,
  Scale,
  Trash2,
  Plus,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export function CreateExamWizard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(3);
  const targetTotal = 10;

  // Question details
  const [questionTitle] = useState("Question 2: Induction & Turns Ratio Derivation");
  const [questionPrompt, setQuestionPrompt] = useState(
    "Explain the working principle of a single-phase transformer with core flux relationships and derive the standard EMF equation. Include step-by-step turns ratio logic."
  );
  const [referenceAnswer, setReferenceAnswer] = useState(
    "A transformer operates on Faraday's Law of Mutual Induction between stationary windings. When AC voltage V1 is supplied, it establishes continuous sinusoidal magnetic flux Phi(t) = Phi_max * sin(omega*t). By Faraday's Law e1 = -N1 (dPhi/dt). RMS values are E1 = 4.44 * f * N1 * Phi_max, E2 = 4.44 * f * N2 * Phi_max. Ratio E2/E1 = N2/N1 = K."
  );

  // Criteria list with live mark calculation
  const [criteria, setCriteria] = useState([
    {
      id: "crit_1",
      number: 1,
      title: "Working Principle & Induction Law",
      subheading: "Core physical phenomenon",
      specification: "Explains Faraday's law of electromagnetic induction clearly",
      marks: 4,
    },
    {
      id: "crit_2",
      number: 2,
      title: "Core Magnetic Flux Linkage",
      subheading: "Magnetic circuit characteristics",
      specification: "Mentions mutual flux linkage and core permeability",
      marks: 3,
    },
    {
      id: "crit_3",
      number: 3,
      title: "EMF Equation & Turns Ratio",
      subheading: "Mathematical deduction",
      specification: "Derives step-by-step ratio E2/E1 = N2/N1",
      marks: 1,
    },
    {
      id: "crit_4",
      number: 4,
      title: "Waveform & Phasor Diagram",
      subheading: "Diagrammatic representation",
      specification: "Draws sinusoidal flux and induced voltage phasors with 90 deg lag",
      marks: 2, // Default to 2 so user can test balanced vs unbalanced
    },
  ]);

  const assignedMarks = criteria.reduce((sum, c) => sum + (parseFloat(c.marks) || 0), 0);
  const remainingMarks = targetTotal - assignedMarks;
  const isBalanced = assignedMarks === targetTotal;

  const handleMarkChange = (id, newMarks) => {
    const val = parseFloat(newMarks) || 0;
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, marks: val } : c))
    );
  };

  const handleTitleChange = (id, newTitle) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleSpecChange = (id, newSpec) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, specification: newSpec } : c))
    );
  };

  const handleAddCriterion = () => {
    const newId = `crit_${Date.now()}`;
    const newCriterion = {
      id: newId,
      number: criteria.length + 1,
      title: "New Criterion",
      subheading: "Evaluation descriptor",
      specification: "Describe grading criteria and evidence required...",
      marks: Math.max(remainingMarks, 1),
    };
    setCriteria((prev) => [...prev, newCriterion]);
    showToast("Added new criterion row to rubric.", "info");
  };

  const handleDeleteCriterion = (id) => {
    if (criteria.length <= 1) {
      showToast("A question must have at least one rubric criterion.", "warning");
      return;
    }
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveAndContinue = async () => {
    if (!isBalanced) {
      showToast(`Please allocate exactly ${targetTotal} marks before proceeding. Currently ${assignedMarks}/${targetTotal}.`, "warning");
      return;
    }

    await examService.createExam({
      title: "Basic Electrical Engineering — Mid-term 2024",
      courseCode: "BEE-104",
      totalMarks: targetTotal,
      prompt: questionPrompt,
      referenceAnswer,
      criteria,
    });

    showToast("Examination question & balanced rubric recorded successfully!", "success");
    navigate("/teacher/exams");
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20">
      {/* 4-Step Flow Stepper */}
      <nav aria-label="Question authoring stages" className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-4 shadow-folio">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[1px] bg-surface-container-high dark:bg-primary -z-0" />

          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-3 bg-surface-container-lowest dark:bg-primary-container px-3 z-10 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-academic-green/10 border border-academic-green flex items-center justify-center text-academic-green">
              <Check className="w-4 h-4 font-bold" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-mono text-outline uppercase tracking-wider">Step 1</span>
              <span className="text-xs font-semibold text-on-surface dark:text-inverse-primary">Formulation</span>
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => setCurrentStep(2)}
            className="flex items-center gap-3 bg-surface-container-lowest dark:bg-primary-container px-3 z-10 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-academic-green/10 border border-academic-green flex items-center justify-center text-academic-green">
              <Check className="w-4 h-4 font-bold" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-mono text-outline uppercase tracking-wider">Step 2</span>
              <span className="text-xs font-semibold text-on-surface dark:text-inverse-primary">Reference Answer</span>
            </div>
          </div>

          {/* Step 3 (Active) */}
          <div className="flex items-center gap-3 bg-surface-container-lowest dark:bg-primary-container px-3 z-10">
            <div className="w-7 h-7 rounded-full bg-primary dark:bg-primary-fixed text-white dark:text-primary flex items-center justify-center text-xs font-bold ring-4 ring-primary/10">
              3
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-primary dark:text-primary-fixed font-bold uppercase tracking-wider">
                Step 3 • Active
              </span>
              <span className="text-xs font-semibold text-primary dark:text-inverse-primary">Marking Rubric</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-3 bg-surface-container-lowest dark:bg-primary-container px-3 z-10 opacity-60">
            <div className="w-7 h-7 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-xs text-outline font-bold">
              4
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-mono text-outline uppercase tracking-wider">Step 4</span>
              <span className="text-xs text-on-surface">Instructions</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Banner */}
      <div className="flex items-center justify-between py-1 border-b border-outline-variant pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-outline uppercase font-mono">
            <span>Course Folio Section B</span>
            <span>•</span>
            <span>Single-Phase Transformers</span>
          </div>
          <h1 className="font-headline text-2xl font-medium text-primary dark:text-inverse-primary tracking-tight mt-0.5">
            {questionTitle}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-mono text-outline">Target Marks</div>
          <div className="font-mono text-base font-bold text-primary dark:text-inverse-primary">
            {targetTotal}.0 MARKS
          </div>
        </div>
      </div>

      {/* Sticky Top Summary Card (Live Allocation Balance Bar) */}
      <div className="sticky top-16 z-20 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-4 shadow-folio flex flex-col gap-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isBalanced
                  ? "bg-academic-green/10 text-academic-green border-academic-green/30"
                  : "bg-academic-amber/10 text-academic-amber border-academic-amber/30"
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-on-surface dark:text-inverse-primary">
                  Total Allocation: {assignedMarks} of {targetTotal} marks assigned
                </span>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-lg border ${
                    isBalanced
                      ? "bg-academic-green/15 text-academic-green border-academic-green/30"
                      : "bg-academic-amber/15 text-academic-amber border-academic-amber/30"
                  }`}
                >
                  {isBalanced ? "Balanced" : remainingMarks > 0 ? `Unbalanced (-${remainingMarks})` : `Over-allocated (+${Math.abs(remainingMarks)})`}
                </span>
              </div>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  isBalanced ? "text-academic-green" : "text-academic-amber"
                }`}
              >
                {isBalanced
                  ? "Rubric points perfectly match the 10.0 target total! You can proceed."
                  : `Assign ${Math.abs(remainingMarks)} more mark(s) to match question total (${targetTotal} marks)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-mono text-2xl font-bold text-primary dark:text-inverse-primary">
                {assignedMarks}
              </span>
              <span className="text-xs text-outline font-mono"> / {targetTotal} max</span>
            </div>
          </div>
        </div>

        {/* Segmented Marks Progress Meter */}
        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isBalanced ? "bg-academic-green" : "bg-academic-amber"
            }`}
            style={{ width: `${Math.min((assignedMarks / targetTotal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Rubric Builder Section */}
      <section className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl overflow-hidden shadow-folio">
        {/* Table Header Strip */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container dark:bg-primary border-b border-outline-variant font-mono uppercase tracking-wider text-xs font-semibold text-outline">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Evaluation Criterion</div>
          <div className="col-span-5">Grading Specification & Key Evidence</div>
          <div className="col-span-1 text-right">Max Marks</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        {/* Criterion Rows */}
        <div className="divide-y divide-outline-variant/60">
          {criteria.map((c) => {
            const hasError = c.marks === 0;

            return (
              <div
                key={c.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-start transition-colors duration-150 ${
                  hasError ? "bg-error/5 border-l-4 border-error" : "hover:bg-surface-container-low/40"
                }`}
              >
                <div className="col-span-1 flex items-center justify-center pt-2">
                  <span className="w-6 h-6 rounded-lg border border-outline-variant bg-surface flex items-center justify-center font-mono text-xs text-outline font-bold">
                    {c.number}
                  </span>
                </div>

                <div className="col-span-4 pt-1">
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => handleTitleChange(c.id, e.target.value)}
                    className="w-full font-headline text-base font-semibold bg-transparent border-none p-0 focus:ring-0 text-primary dark:text-inverse-primary"
                  />
                  <span className="text-[11px] font-mono text-outline block mt-0.5">
                    {c.subheading}
                  </span>
                  {hasError && (
                    <div className="flex items-center gap-1 text-error mt-2 text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Missing marks allocation</span>
                    </div>
                  )}
                </div>

                <div className="col-span-5">
                  <textarea
                    rows={2}
                    value={c.specification}
                    onChange={(e) => handleSpecChange(c.id, e.target.value)}
                    className="w-full text-xs bg-surface-container-low dark:bg-primary border border-outline-variant rounded-xl p-2.5 text-on-surface dark:text-inverse-primary focus:outline-none focus:border-primary resize-none leading-relaxed"
                  />
                </div>

                <div className="col-span-1 flex justify-end pt-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={c.marks}
                      onChange={(e) => handleMarkChange(c.id, e.target.value)}
                      className="w-12 text-center bg-[#f2d45c] text-[#1e2433] font-mono text-xs font-bold py-1 px-1 rounded-lg border border-[#e2c54f] focus:outline-none"
                    />
                    <span className="text-xs text-outline font-mono">pts</span>
                  </div>
                </div>

                <div className="col-span-1 flex justify-center pt-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteCriterion(c.id)}
                    className="text-outline hover:text-error p-1 rounded-lg hover:bg-surface-container transition-colors"
                    title="Delete criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Criterion Button Strip */}
        <div className="p-4 bg-surface dark:bg-primary-container border-t border-outline-variant">
          <button
            type="button"
            onClick={handleAddCriterion}
            className="w-full py-3 border-2 border-dashed border-outline-variant hover:border-primary rounded-xl text-on-surface dark:text-inverse-primary text-xs font-semibold flex items-center justify-center gap-2 hover:bg-surface-container transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add criterion row</span>
          </button>
        </div>
      </section>

      {/* Marginalia Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-low dark:bg-primary-container border border-outline-variant rounded-2xl p-4 flex items-start gap-4 shadow-xs">
          <BookOpen className="w-6 h-6 text-primary dark:text-inverse-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-headline text-sm font-semibold text-primary dark:text-inverse-primary">
              Departmental Rubric Standard (EE-2024 Rev B)
            </div>
            <p className="text-outline leading-relaxed">
              All analytical engineering questions require discrete marks for physical principle justification (30-40%), analytical proof (40%), and illustrative diagrammatic clarity (20%). Marking criteria will be shared directly with students alongside final graded folios.
            </p>
          </div>
        </div>

        <div className="md:col-span-1 bg-surface-container-low dark:bg-primary-container border border-outline-variant rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-1">
              Rubric Balance
            </div>
            <div className="font-headline text-base font-semibold text-primary dark:text-inverse-primary">
              {assignedMarks} / {targetTotal} assigned
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold mt-3 text-academic-green">
            <Check className="w-4 h-4" />
            <span>Ready for moderation</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <footer className="pt-4 border-t border-outline-variant flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/teacher/exams")}
          className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-outline font-mono">Unsaved changes in Question 2</span>
          <button
            type="button"
            disabled={!isBalanced}
            onClick={handleSaveAndContinue}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isBalanced
                ? "bg-primary dark:bg-primary-fixed text-white dark:text-primary hover:bg-primary-hover shadow-sm"
                : "bg-surface-container text-outline cursor-not-allowed border border-outline-variant"
            }`}
          >
            <span>Save and Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
