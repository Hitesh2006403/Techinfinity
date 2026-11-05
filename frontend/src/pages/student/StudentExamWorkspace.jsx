import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submissionService } from "../../services/submissionService";
import { useToast } from "../../context/ToastContext";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Info,
  Send,
  HelpCircle,
  X,
  Eye,
  Trash2,
  Sparkles,
  PenTool
} from "lucide-react";

export function StudentExamWorkspace() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState("upload"); // "type" | "upload"
  const [typedAnswer, setTypedAnswer] = useState("");
  const [ocrText, setOcrText] = useState(`1. PRINCIPLE:
A single-phase transformer operates on Faraday's Law of Mutual Electromagnetic Induction. When alternating voltage V1 is supplied to the primary winding with N1 turns, an alternating flux Phi is established in the laminated silicon-steel magnetic core.

2. CORE FLUX RELATIONSHIP:
Let Phi(t) = Phi_max * sin(omega * t), where omega = 2 * pi * f.
This flux links both primary and secondary windings without conductive contact.

3. EMF EQUATION DERIVATION:
By Faraday's law of induction, induced EMF at any instant is:
e1 = -N1 * (dPhi / dt)
e1 = -N1 * d/dt [Phi_max * sin(omega * t)]
e1 = -N1 * omega * Phi_max * cos(omega * t)
e1 = N1 * omega * Phi_max * sin(omega * t - 90 deg)

Maximum instantaneous EMF:
E_max1 = N1 * omega * Phi_max = 2 * pi * f * N1 * Phi_max

RMS value of induced EMF:
E1 = E_max1 / sqrt(2) = (2 * pi / sqrt(2)) * f * N1 * Phi_max
E1 = 4.44 * f * N1 * Phi_max (Volts)

Similarly, for the secondary winding:
E2 = 4.44 * f * N2 * Phi_max (Volts)

4. TURNS RATIO:
Dividing E2 by E1 gives:
E2 / E1 = N2 / N1 = K (Transformation Ratio)`);

  const [uploadedFile, setUploadedFile] = useState({
    name: "page_01_transformer_answer.jpg",
    size: "2.4 MB",
    uploaded: true,
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploaded: true,
      });
      showToast("Uploaded script. Processing optical OCR transcription...", "info");
      const result = await submissionService.simulateOCR(file);
      setOcrText(result.extractedText);
      showToast("OCR complete with 98.4% confidence! Please verify text.", "success");
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    await submissionService.submitAnswer({
      examId: "exam_bee_midterm",
      questionId: "q_bee_02",
      answerText: inputMode === "upload" ? ocrText : typedAnswer,
    });
    showToast("Question 2 recorded to your exam docket!", "success");
    setIsSubmitting(false);
    setShowSubmitModal(false);
    navigate("/student/status");
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20">
      {/* ===================================================================== */}
      {/* Left Column: Question Panel (5 cols)                                  */}
      {/* ===================================================================== */}
      <section className="lg:col-span-5 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl flex flex-col p-6 shadow-folio sticky top-20 space-y-6">
        {/* Panel Header & Navigator */}
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded-lg text-outline border border-outline-variant/60">
              Section B • Core Theory
            </span>
            <span className="font-mono text-xs text-outline">Paper Code: EE-201</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => showToast("Navigated to Question 1", "info")}
              className="p-1 hover:bg-surface-container rounded-lg text-outline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold px-1 text-primary dark:text-inverse-primary">Q2 of 5</span>
            <button
              onClick={() => showToast("Navigated to Question 3", "info")}
              className="p-1 hover:bg-surface-container rounded-lg text-outline"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Question Statement */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="font-headline text-lg font-bold text-primary dark:text-inverse-primary">
              2.
            </span>
            <h2 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary leading-snug">
              Explain the working principle of a single-phase transformer with core flux relationships and derive the standard EMF equation. Include step-by-step turns ratio logic.
            </h2>
          </div>
          <p className="text-xs text-outline leading-relaxed">
            Ensure mathematical completeness. Clearly define all instantaneous notations (Φ, e₁, e₂) and distinguish between maximum and RMS potentials across both winding coils.
          </p>
        </div>

        {/* Requirements Ruled Breakdown Card */}
        <div className="border border-outline-variant bg-surface-container-low/60 dark:bg-primary rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary dark:text-inverse-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary dark:text-inverse-primary">
              Evaluation Rubric & Breakdown
            </h3>
          </div>

          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-academic-green shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-on-surface dark:text-inverse-primary">
                  Principle of Electromagnetic Induction
                </span>
                <p className="text-outline text-[11px]">Detail Faraday&apos;s Law & Lenz&apos;s Law governing mutual induction.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 border-t border-outline-variant/60 pt-2.5">
              <CheckCircle2 className="w-4 h-4 text-academic-green shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-on-surface dark:text-inverse-primary">
                  Core Flux Linkage & Waveform
                </span>
                <p className="text-outline text-[11px]">Illustrate sinusoidal flux variation: Φ(t) = Φₘ sin(ωt).</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 border-t border-outline-variant/60 pt-2.5">
              <CheckCircle2 className="w-4 h-4 text-academic-green shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-on-surface dark:text-inverse-primary">
                  EMF Equations Derivation (E₁ & E₂)
                </span>
                <p className="text-outline text-[11px]">Derive E_rms = 4.44 · f · N · Φₘ and state transformation ratio K = N₂/N₁.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Instructor Guidance Note */}
        <div className="p-3 bg-surface-container dark:bg-primary rounded-xl border-l-2 border-primary text-xs text-outline flex items-center gap-2">
          <Info className="w-4 h-4 text-primary dark:text-inverse-primary shrink-0" />
          <span>Examiners grant partial credit for clear turns-ratio derivations and hand-drawn flux diagrams.</span>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* Right Column: Answer Input Area (7 cols)                              */}
      {/* ===================================================================== */}
      <section className="lg:col-span-7 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl flex flex-col p-6 space-y-6 shadow-folio">
        {/* Input Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setInputMode("type")}
              className={`flex items-center gap-2 pb-2 text-xs font-semibold transition-colors ${
                inputMode === "type"
                  ? "text-primary dark:text-inverse-primary border-b-2 border-primary dark:border-primary-fixed"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Type answer</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex items-center gap-2 pb-2 text-xs font-semibold transition-colors ${
                inputMode === "upload"
                  ? "text-primary dark:text-inverse-primary border-b-2 border-primary dark:border-primary-fixed"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload handwritten answer</span>
            </button>
          </div>
          <span className="text-[10px] font-mono text-outline bg-surface-container px-2 py-0.5 rounded-md">
            Active Workspace
          </span>
        </div>

        {inputMode === "type" ? (
          /* Typed Mode */
          <div className="space-y-3">
            <textarea
              rows={16}
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              className="w-full bg-surface-container-lowest dark:bg-primary border border-outline-variant rounded-xl p-4 text-xs font-mono leading-relaxed focus:outline-none focus:border-primary resize-y"
              placeholder="Type your complete mathematical proof and physical explanation here..."
            />
            <div className="flex items-center justify-between text-xs text-outline font-mono">
              <span>Word count: {typedAnswer.split(/\s+/).filter(Boolean).length}</span>
              <span className="text-academic-green">Auto-saved</span>
            </div>
          </div>
        ) : (
          /* Upload & OCR Mode */
          <div className="space-y-4">
            {/* 1. Dropzone */}
            <div className="border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low/60 dark:bg-primary/30 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high dark:bg-primary flex items-center justify-center mb-3 text-primary dark:text-inverse-primary">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-primary dark:text-inverse-primary">
                Drag and drop your scanned handwritten pages or photos here
              </p>
              <p className="text-[11px] text-outline mt-1">
                or <span className="underline font-semibold text-brand">browse local files</span>
              </p>
              <div className="mt-2.5 text-[10px] font-mono text-outline bg-surface-container px-2 py-0.5 rounded-md">
                JPG, PNG, PDF (up to 15MB)
              </div>
            </div>

            {/* 2. Uploaded File Card */}
            {uploadedFile && (
              <div className="border border-outline-variant bg-surface-container-low/40 dark:bg-primary rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-container dark:bg-primary-container rounded-lg text-primary dark:text-inverse-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary dark:text-inverse-primary font-mono">
                        {uploadedFile.name} ({uploadedFile.size})
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-academic-green" />
                        <span className="text-[11px] font-semibold text-academic-green">
                          Processed by Optical OCR Engine
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => showToast("Displaying high-resolution scan sheet...", "info")}
                      className="p-1.5 text-outline hover:text-on-surface rounded-lg"
                      title="View Full Scan"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        showToast("Removed uploaded scan file.", "info");
                      }}
                      className="p-1.5 text-outline hover:text-error rounded-lg"
                      title="Remove File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-academic-green h-full rounded-full w-full" />
                </div>
              </div>
            )}

            {/* 3. OCR Output Review / Editable Area */}
            <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-lowest dark:bg-primary space-y-3">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-secondary dark:text-secondary-fixed" />
                  <label
                    htmlFor="ocrTranscriptionArea"
                    className="text-xs font-semibold text-primary dark:text-inverse-primary"
                  >
                    Text we read from your page
                  </label>
                </div>
                <span className="text-[10px] font-mono bg-surface-container px-2 py-0.5 rounded-md text-outline">
                  Editable OCR Layer
                </span>
              </div>

              <div className="bg-surface-container-low dark:bg-primary/50 border border-outline-variant p-2.5 rounded-xl flex items-start gap-2 text-xs text-outline">
                <Info className="w-4 h-4 shrink-0 text-primary dark:text-inverse-primary mt-0.5" />
                <p>
                  Fix any OCR transcription mistakes before submitting. Academic evaluators read both your scan and this text.
                </p>
              </div>

              <textarea
                id="ocrTranscriptionArea"
                rows={9}
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                className="w-full bg-surface-container-lowest dark:bg-primary border border-outline-variant rounded-xl p-3 font-mono text-xs text-on-surface dark:text-inverse-primary leading-relaxed resize-y focus:outline-none focus:border-primary"
              />

              <div className="flex items-center justify-between text-outline text-[11px] font-mono pt-1">
                <span>Character count: {ocrText.length} • Word count: {ocrText.split(/\s+/).filter(Boolean).length}</span>
                <span className="text-academic-green font-semibold">Auto-saved 1 min ago</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => showToast("Draft saved locally to browser storage.", "info")}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            <span>Save draft</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setOcrText("");
                setTypedAnswer("");
                showToast("Cleared response text area.", "info");
              }}
              className="px-3 py-2 text-xs text-outline hover:text-on-surface transition-colors"
            >
              Clear Response
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-primary-fixed hover:bg-primary-hover text-white dark:text-primary text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <span>Submit answer</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Confirmation Modal Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-tertiary">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary">
                    Submit Question 2?
                  </h3>
                  <p className="text-xs text-outline font-mono">Question 2 of 5 • 10 Marks Allocated</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-y border-outline-variant/60 py-4 space-y-3 text-xs leading-relaxed text-on-surface-variant dark:text-outline">
              <p>
                Are you sure you want to submit Question 2? You can still review other questions before final exam hand-in.
              </p>
              <div className="bg-surface-container-low dark:bg-primary p-3 rounded-xl border border-outline-variant space-y-1 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-primary dark:text-inverse-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-academic-green" />
                  <span>1 file attached: page_01_transformer_answer.jpg</span>
                </div>
                <div className="flex items-center gap-2 text-primary dark:text-inverse-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-academic-green" />
                  <span>Transcribed text verified and ready for evaluator comparison.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="px-5 py-2 bg-primary dark:bg-primary-fixed text-white dark:text-primary text-xs font-semibold rounded-xl hover:bg-primary-hover shadow-xs transition-colors"
              >
                {isSubmitting ? "Recording..." : "Confirm Submission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
