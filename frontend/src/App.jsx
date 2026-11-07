import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AppLayout } from "./layouts/AppLayout";

// Landing & Portal Pages
import { PortalGateway } from "./pages/auth/PortalGateway";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { TeacherLoginPage } from "./pages/auth/TeacherLoginPage";
import { StudentLoginPage } from "./pages/auth/StudentLoginPage";
import { AdminLoginPage } from "./pages/auth/AdminLoginPage";

// Teacher Pages
import { TeacherDashboard } from "./pages/teacher/TeacherDashboard";
import { CreateExamWizard } from "./pages/teacher/CreateExamWizard";
import { ExamManagement } from "./pages/teacher/ExamManagement";
import { SubmissionsList } from "./pages/teacher/SubmissionsList";
import { TeacherReviewWorkbench } from "./pages/teacher/TeacherReviewWorkbench";
import { ClassAnalytics } from "./pages/teacher/ClassAnalytics";
import { SubjectClassroomManagement } from "./pages/teacher/SubjectClassroomManagement";

// Student Pages
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { AssignedExamsList } from "./pages/student/AssignedExamsList";
import { StudentExamWorkspace } from "./pages/student/StudentExamWorkspace";
import { SubmissionStatusPage } from "./pages/student/SubmissionStatusPage";
import { StudentResultFolio } from "./pages/student/StudentResultFolio";
import { StudentResultsLive } from "./pages/student/StudentResultsLive";
import { LearningAssistantPage } from "./pages/student/LearningAssistantPage";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Landing Gateway (Landing page for all 3 portals) */}
            <Route path="/" element={<PortalGateway />} />
            <Route path="/portals" element={<PortalGateway />} />

            {/* Dedicated Login & Register Portals */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login/teacher" element={<TeacherLoginPage />} />
            <Route path="/login/student" element={<StudentLoginPage />} />
            <Route path="/login/admin" element={<AdminLoginPage />} />

            {/* Authenticated Workspace Layout */}
            <Route element={<AppLayout />}>
              {/* Teacher Routes */}
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/exams" element={<ExamManagement />} />
              <Route path="/teacher/create-exam" element={<CreateExamWizard />} />
              <Route path="/teacher/submissions" element={<SubmissionsList />} />
              <Route path="/teacher/review" element={<TeacherReviewWorkbench />} />
              <Route path="/teacher/review/:id" element={<TeacherReviewWorkbench />} />
              <Route path="/teacher/analytics" element={<ClassAnalytics />} />
              <Route path="/teacher/manage" element={<SubjectClassroomManagement />} />

              {/* Student Routes */}
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/exams" element={<AssignedExamsList />} />
              <Route path="/student/exam/:id" element={<StudentExamWorkspace />} />
              <Route path="/student/status" element={<SubmissionStatusPage />} />
              <Route path="/student/results" element={<StudentResultsLive />} />

              {/* Common Learning Assistant */}
              <Route path="/assistant" element={<LearningAssistantPage />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
