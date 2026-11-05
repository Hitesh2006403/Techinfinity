import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'

export function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, role, isAuthenticated, isLoading } = useAuth()
  const { toast } = useNotification()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated && role && !allowedRoles.includes(role)) {
      toast.warning(`Access Restricted: ${role} accounts cannot access this dashboard.`)
    }
  }, [isAuthenticated, role, allowedRoles, toast])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying role credentials...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Enforce strict role isolation
  if (!allowedRoles.includes(role)) {
    if (role === 'Admin') return <Navigate to="/admin" replace />
    if (role === 'Teacher') return <Navigate to="/teacher" replace />
    return <Navigate to="/student" replace />
  }

  return children
}
