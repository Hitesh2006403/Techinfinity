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
    try {
      const response = await api.get("/subjects/");
      return response.data;
    } catch {
      return MOCK_SUBJECTS;
    }
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
