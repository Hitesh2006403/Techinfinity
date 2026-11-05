import React, { createContext, useContext, useState } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AUTH_STORAGE_KEY = 'evalai_auth_user'

export const DEFAULT_USERS = {
  Student: {
    id: 1,
    username: 'alex.student',
    full_name: 'Alex Turner',
    email: 'alex.student@evalai.edu',
    role: 'Student',
    department: 'Mechatronics & AI Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    student_id: 'EVAL-2026-8842',
    progress: 84,
  },
  Teacher: {
    id: 10,
    username: 'marcus.vance',
    full_name: 'Prof. Marcus Vance',
    email: 'marcus.vance@evalai.edu',
    role: 'Teacher',
    department: 'Department of Computer Science & AI',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    faculty_id: 'FAC-EVAL-402',
    courses_count: 4,
  },
  Admin: {
    id: 20,
    username: 'admin.arthur',
    full_name: 'Dr. Arthur Pendelton',
    email: 'admin@evalai.io',
    role: 'Admin',
    department: 'Systems & Academic Administration',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    admin_level: 'Super Admin',
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Error restoring session:', e)
    }
    return null
  })

  const [isLoading, setIsLoading] = useState(false)

  const login = async (username, password, selectedRole, rememberMe = true) => {
    setIsLoading(true)
    try {
      const response = await authAPI.login(username, password, selectedRole)
      if (response && response.user) {
        setUser(response.user)
        if (rememberMe) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user))
          sessionStorage.removeItem(AUTH_STORAGE_KEY)
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user))
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
        return response.user
      } else {
        throw new Error('Malformed response from authentication server.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const demoLogin = async (roleName, rememberMe = true) => {
    setIsLoading(true)
    try {
      const response = await authAPI.demoLogin(roleName)
      if (response && response.user) {
        setUser(response.user)
        if (rememberMe) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user))
          sessionStorage.removeItem(AUTH_STORAGE_KEY)
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user))
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
        return response.user
      }
      throw new Error('Failed to load demo account.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authAPI.logout()
    } finally {
      setUser(null)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      setIsLoading(false)
    }
  }

  const switchRoleQuick = (targetRole) => {
    if (DEFAULT_USERS[targetRole]) {
      const newUser = DEFAULT_USERS[targetRole]
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    }
  }

  const updateProfile = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updatedFields }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        logout,
        switchRoleQuick,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
