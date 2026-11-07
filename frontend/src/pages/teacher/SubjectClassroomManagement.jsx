import { useEffect, useState } from "react";
import { examService } from "../../services/examService";
import { authService } from "../../services/authService";

function Status({ status }) {
  const colour = status === "COMPLETED" ? "text-green-700 bg-green-50" : status === "FAILED" ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${colour}`}>{status || "PENDING"}</span>;
}

export function SubjectClassroomManagement() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState(null);
  const [scheme, setScheme] = useState(null);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(null);

  const refreshSubjects = async () => setSubjects(await examService.getSubjects());
  const refreshPipeline = async (subjectId) => setPipeline(await examService.getPipeline(subjectId));

  useEffect(() => {
    refreshSubjects();
    authService.getStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  const chooseSubject = async (subject) => {
    setSelected(subject);
    setMessage("");
    await refreshPipeline(subject.id);
  };

  const createSubject = async (event) => {
    event.preventDefault();
    if (!name.trim() || !reference) {
      setMessage("Enter a subject name and upload the required reference PDF before creating the subject.");
      return;
    }
    setBusy(true);
    try {
      const subject = await examService.createSubject({ name, notesDescription: description, referenceNotes: reference, evaluationScheme: scheme });
      setName(""); setDescription(""); setReference(null); setScheme(null);
      await refreshSubjects();
      await chooseSubject(subject);
      setMessage("Subject created. Reference processing has started.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Subject could not be created.");
    } finally { setBusy(false); }
  };

  const latestPaper = pipeline?.question_papers?.[0];
  const extractedQuestions = latestPaper?.questions || [];
  const referenceReady = pipeline?.reference_documents?.some((doc) => doc.processing_status === "COMPLETED");
  const paperReady = latestPaper?.processing_status === "COMPLETED" && extractedQuestions.length > 0;
  const marksReady = paperReady && extractedQuestions.every((question) => question.maximum_marks !== null);

  const saveQuestionCorrection = async (question) => {
    setSavingQuestion(question.id);
    try {
      const updated = await examService.updateExtractedQuestion(question.id, {
        text: question.text,
        maximum_marks: question.maximum_marks,
      });
      setPipeline((current) => ({
        ...current,
        question_papers: current.question_papers.map((paper) => ({
          ...paper,
          questions: paper.questions.map((item) => item.id === updated.id ? updated : item),
        })),
      }));
      setMessage(`Question ${question.number} correction saved.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Question correction could not be saved.");
    } finally { setSavingQuestion(null); }
  };

  const editQuestion = (question, field, value) => {
    setPipeline((current) => ({
      ...current,
      question_papers: current.question_papers.map((paper) => ({
        ...paper,
        questions: paper.questions.map((item) => item.id === question.id ? { ...item, [field]: field === "maximum_marks" ? (value === "" ? null : value) : value } : item),
      })),
    }));
  };

  const uploadPaper = async () => {
    if (!selected || !questionPaper) return;
    setBusy(true);
    try {
      await examService.uploadQuestionPaper(selected.id, questionPaper);
      await refreshPipeline(selected.id);
      setQuestionPaper(null);
      setMessage("Question paper uploaded and extracted for review.");
    } catch (error) { setMessage(error.response?.data?.message || "Question paper upload failed."); }
    finally { setBusy(false); }
  };

  const uploadAnswer = async () => {
    if (!selected || !studentId || !answerSheet) return;
    setBusy(true);
    try {
      const result = await examService.uploadStudentAnswer({ subjectId: selected.id, studentId, document: answerSheet });
      setAnswerSheet(null);
      setMessage(`Answer sheet queued for background RAG/Groq evaluation. Submission #${result.submission?.id || "created"}.`);
    } catch (error) { setMessage(error.response?.data?.message || "Answer sheet upload failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs uppercase tracking-wider text-slate-500">Teacher workspace</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Subject correction pipeline</h1>
        <p className="mt-2 text-sm text-slate-500">Each subject owns its reference PDF, question paper, and student answer-sheet evaluations.</p>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <h2 className="font-semibold text-slate-900">What the RAG correction needs</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-slate-600">
          <div><strong className="text-slate-900">1. Reference PDF</strong><p>Teacher notes, textbook material, definitions, formulas, and expected concepts for this subject.</p></div>
          <div><strong className="text-slate-900">2. Question paper</strong><p>Questions with visible numbers and marks, such as “1. Explain … (10 marks)”.</p></div>
          <div><strong className="text-slate-900">3. Student answer sheet</strong><p>One student’s PDF scan or clear JPG/PNG pages, with question numbers visible.</p></div>
        </div>
        <p className="mt-3 text-xs text-blue-800">The answer sheet cannot be queued until the reference is processed, every question is extracted, and every question has a maximum mark.</p>
      </section>

      <form onSubmit={createSubject} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-slate-900">Create a subject</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject name, e.g. Software Engineering" className="rounded-lg border p-2 text-sm" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Marking guidance or syllabus notes" className="rounded-lg border p-2 text-sm" />
          <label className="text-sm text-slate-600">Reference PDF <span className="text-red-600">*</span><input type="file" accept=".pdf" onChange={(e) => setReference(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm" /><span className="mt-1 block text-xs text-slate-400">Required. PDF recommended, max 25 MB.</span></label>
          <label className="text-sm text-slate-600">Optional marking scheme<input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setScheme(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm" /><span className="mt-1 block text-xs text-slate-400">Use this for criterion weights or grading rules.</span></label>
        </div>
        <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create subject</button>
      </form>

      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
          <h2 className="px-2 pb-2 font-semibold text-slate-900">My subjects</h2>
          {subjects.map((subject) => <button key={subject.id} onClick={() => chooseSubject(subject)} className={`w-full rounded-lg p-3 text-left text-sm ${selected?.id === subject.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}>{subject.name}</button>)}
          {!subjects.length && <p className="px-2 text-sm text-slate-500">Create your first subject.</p>}
        </aside>

        <main className="space-y-5">
          {message && <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</div>}
          {!selected && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Select a subject to manage its reference and answer sheets.</div>}
          {selected && <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">{selected.name} RAG processing</h2><p className="text-sm text-slate-500">Reference material is retrieved only for this subject.</p></div><button onClick={() => refreshPipeline(selected.id)} className="text-sm text-blue-700">Refresh</button></div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">Reference documents</p>{pipeline?.reference_documents?.map((doc) => <div key={doc.id} className="mt-2 flex items-center justify-between text-sm"><span>{doc.document?.split("/").pop()}</span><Status status={doc.processing_status} /></div>)}</div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">Question papers</p>{pipeline?.question_papers?.map((paper) => <div key={paper.id} className="mt-2 flex items-center justify-between text-sm"><span>{paper.questions?.length || 0} extracted questions</span><Status status={paper.processing_status} /></div>)}</div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"><h2 className="font-semibold text-slate-900">Upload question paper</h2><p className="text-sm text-slate-500">Use a PDF with numbered questions and marks. The extracted questions appear below for correction.</p><input type="file" accept=".pdf" onChange={(e) => setQuestionPaper(e.target.files?.[0] || null)} /><button disabled={busy || !questionPaper} onClick={uploadPaper} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Upload and extract questions</button></section>
            {paperReady && <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"><div><h2 className="font-semibold text-slate-900">Review extracted questions</h2><p className="text-sm text-slate-500">Correct OCR text and marks before any student paper is evaluated.</p></div>{extractedQuestions.map((question) => <div key={question.id} className="border-t pt-4 space-y-2"><label className="block text-xs font-semibold text-slate-600">Question {question.number}<textarea value={question.text} onChange={(e) => editQuestion(question, "text", e.target.value)} rows={2} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><div className="flex items-center gap-3"><label className="text-xs font-semibold text-slate-600">Maximum marks<input type="number" min="0.5" step="0.5" value={question.maximum_marks ?? ""} onChange={(e) => editQuestion(question, "maximum_marks", e.target.value)} className="ml-2 w-24 rounded-lg border p-2 text-sm" /></label><button disabled={savingQuestion === question.id} onClick={() => saveQuestionCorrection(question)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">{savingQuestion === question.id ? "Saving…" : "Save correction"}</button></div></div>)}</section>}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"><h2 className="font-semibold text-slate-900">Upload a particular student answer sheet</h2><p className="text-sm text-slate-500">Required before processing: <span className={referenceReady ? "text-green-700" : "text-red-600"}>reference ready</span>, <span className={marksReady ? "text-green-700" : "text-red-600"}>all question marks saved</span>.</p><select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-lg border p-2 text-sm"><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.first_name || student.username} ({student.username})</option>)}</select><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setAnswerSheet(e.target.files?.[0] || null)} /><p className="text-xs text-slate-500">Upload one clear PDF or image scan. The worker reads handwriting, maps answers, retrieves this subject’s reference, and sends the comparison to Groq.</p><button disabled={busy || !answerSheet || !studentId || !referenceReady || !marksReady} onClick={uploadAnswer} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Queue answer-sheet evaluation</button></section>
          </>}
        </main>
      </div>
    </div>
  );
}
