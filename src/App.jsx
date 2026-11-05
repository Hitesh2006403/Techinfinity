import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Login } from './pages/auth/Login'
import { RoleDashboardHub } from './pages/RoleDashboardHub'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { TeacherDashboard } from './pages/teacher/TeacherDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { NotFound } from './pages/NotFound'

function RootRedirect() {
  const { user, role, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/role-hub" replace />
  }

  if (role === 'Admin') return <Navigate to="/admin" replace />
  if (role === 'Teacher') return <Navigate to="/teacher" replace />
  return <Navigate to="/student" replace />
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Routes>
              {/* Public Entry */}
              <Route path="/login" element={<Login />} />
              <Route path="/role-hub" element={<RoleDashboardHub />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Exactly Three Role Dashboards */}
              <Route
                path="/student/*"
                element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teacher/*"
                element={
                  <ProtectedRoute allowedRoles={['Teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
