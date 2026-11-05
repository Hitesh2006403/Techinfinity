import api from "./api";
import { MOCK_SUBMISSIONS, MOCK_CLASS_PERFORMANCE, MOCK_STUDENT_RESULTS } from "../utils/mockData";

export const evaluationService = {
  async getEvaluationReport(submissionId) {
    try {
      const response = await api.get(`/evaluations/${submissionId}/`);
      return response.data;
    } catch {
      const subs = JSON.parse(localStorage.getItem("eduinfinity_submissions") || "[]");
      const found = subs.find((s) => s.id === submissionId) || MOCK_SUBMISSIONS[0];
      return found;
    }
  },

  async saveTeacherReview(submissionId, reviewData) {
    try {
      const response = await api.post(`/evaluations/${submissionId}/review/`, reviewData);
      return response.data;
    } catch {
      const subs = JSON.parse(localStorage.getItem("eduinfinity_submissions") || JSON.stringify(MOCK_SUBMISSIONS));
      const index = subs.findIndex((s) => s.id === submissionId);
      if (index !== -1) {
        subs[index] = {
          ...subs[index],
          teacherScore: reviewData.calculatedTotal,
          teacherFeedback: reviewData.teacherFeedback,
          criteriaEvaluations: reviewData.criteriaEvaluations,
          status: reviewData.publish ? "published" : "teacher_reviewed"
        };
        localStorage.setItem("eduinfinity_submissions", JSON.stringify(subs));
      }
      return { success: true, message: reviewData.publish ? "Result published!" : "Draft review saved." };
    }
  },

  async getClassAnalytics(examId) {
    try {
      const response = await api.get(`/analytics/${examId ? `?exam=${examId}` : ""}`);
      return response.data;
    } catch {
      return MOCK_CLASS_PERFORMANCE;
    }
  },

  async getStudentResult(examId, studentId) {
    try {
      const response = await api.get(`/results/?exam=${examId}&student=${studentId}`);
      return response.data;
    } catch {
      return MOCK_STUDENT_RESULTS[0];
    }
  }
};
