import api from "./api";
import { MOCK_EXAMS, MOCK_SUBJECTS, MOCK_CLASSROOMS } from "../utils/mockData";

const STORAGE_KEY_EXAMS = "eduinfinity_exams";

function getStoredExams() {
  const data = localStorage.getItem(STORAGE_KEY_EXAMS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return MOCK_EXAMS;
    }
  }
  localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(MOCK_EXAMS));
  return MOCK_EXAMS;
}

export const examService = {
  async getExams() {
    try {
      const response = await api.get("/exams/");
      return response.data;
    } catch {
      return getStoredExams();
    }
  },

  async getExamById(id) {
    try {
      const response = await api.get(`/exams/${id}/`);
      return response.data;
    } catch {
      const exams = getStoredExams();
      return exams.find((e) => e.id === id) || exams[0];
    }
  },

  async createExam(examData) {
    try {
      const response = await api.post("/exams/", examData);
      return response.data;
    } catch {
      const exams = getStoredExams();
      const newExam = {
        ...examData,
        id: `exam_${Date.now()}`,
        status: "active",
        submissionsCount: 0,
        totalEnrolled: 72,
        reviewedCount: 0,
        markingDeadlineDays: 14
      };
      const updated = [newExam, ...exams];
      localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(updated));
      return newExam;
    }
  },

  async getSubjects() {
    const response = await api.get("/questions/subjects/");
    return response.data?.data?.resources || [];
  },

  async createSubject({ name, notesDescription, referenceNotes, evaluationScheme }) {
    const form = new FormData();
    form.append("name", name);
    form.append("notes_description", notesDescription || "");
    if (referenceNotes) form.append("reference_notes", referenceNotes);
    if (evaluationScheme) form.append("evaluation_scheme", evaluationScheme);
    const response = await api.post("/questions/subjects/", form, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data?.data?.resource;
  },

  async getPipeline(subjectId) {
    const response = await api.get(`/questions/subjects/${subjectId}/pipeline/`);
    return response.data?.data || { reference_documents: [], question_papers: [] };
  },

  async updateExtractedQuestion(questionId, data) {
    const response = await api.patch(`/questions/extracted-questions/${questionId}/`, data);
    return response.data?.data?.question;
  },

  async uploadQuestionPaper(subjectId, document) {
    const form = new FormData();
    form.append("document_type", "QUESTION_PAPER");
    form.append("subject", subjectId);
    form.append("document", document);
    const response = await api.post("/submissions/answer-sheets/upload/", form, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data?.data?.upload;
  },

  async uploadStudentAnswer({ subjectId, studentId, document }) {
    const form = new FormData();
    form.append("subject_id", subjectId);
    form.append("student_id", studentId);
    form.append("document", document);
    const response = await api.post("/submissions/answer-sheets/mapped-upload/", form, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data?.data;
  },

  async getClassrooms() {
    try {
      const response = await api.get("/classrooms/");
      return response.data;
    } catch {
      return MOCK_CLASSROOMS;
    }
  }
};
