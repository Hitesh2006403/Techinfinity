import api from "./api";
import { MOCK_SUBMISSIONS } from "../utils/mockData";

const STORAGE_KEY_SUBMISSIONS = "eduinfinity_submissions";

function getStoredSubmissions() {
  const data = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return MOCK_SUBMISSIONS;
    }
  }
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(MOCK_SUBMISSIONS));
  return MOCK_SUBMISSIONS;
}

export const submissionService = {
  async getSubmissions(examId) {
    try {
      const response = await api.get(`/submissions/${examId ? `?exam=${examId}` : ""}`);
      return response.data;
    } catch {
      const all = getStoredSubmissions();
      return examId ? all.filter((s) => s.examId === examId) : all;
    }
  },

  async getSubmissionById(id) {
    try {
      const response = await api.get(`/submissions/${id}/`);
      return response.data;
    } catch {
      const all = getStoredSubmissions();
      return all.find((s) => s.id === id) || all[0];
    }
  },

  async submitAnswer(answerData) {
    try {
      const response = await api.post("/submissions/", answerData);
      return response.data;
    } catch {
      const all = getStoredSubmissions();
      const newSub = {
        id: `subm_${Date.now()}`,
        examId: answerData.examId || "exam_bee_midterm",
        questionId: answerData.questionId || "q_bee_02",
        studentId: answerData.studentId || "usr_aarav_sharma",
        studentName: answerData.studentName || "Aarav Sharma",
        studentRoll: "EE-2024-042",
        scriptId: `#SCR-${Math.floor(10000 + Math.random() * 90000)}`,
        submittedAt: "Just now",
        room: "Online Examination Portal",
        status: "ai_evaluating",
        ocrVerified: true,
        ocrConfidence: "98.8%",
        totalMaxMarks: 10,
        aiScore: 8.0,
        teacherScore: 8.0,
        studentAnswerText: answerData.answerText || "",
        handwrittenScanUrl: answerData.fileUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        concepts: { correct: 4, needsClarification: 1, inaccurate: 0 }
      };
      const updated = [newSub, ...all];
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updated));
      return newSub;
    }
  },

  // Simulates OCR processing from an uploaded image/PDF
  async simulateOCR(file) {
    // Artificial 1 second delay to simulate optical recognition
    await new Promise((res) => setTimeout(res, 900));
    return {
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      confidence: "98.4%",
      extractedText: `1. PRINCIPLE:
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
E2 / E1 = N2 / N1 = K (Transformation Ratio)`
    };
  }
};
