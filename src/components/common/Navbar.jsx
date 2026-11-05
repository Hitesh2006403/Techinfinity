import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Sparkles,
  Shield,
  GraduationCap,
  BookOpen,
  Menu,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { Badge } from './Badge'
import { useNavigate } from 'react-router-dom'

export function Navbar({ onMobileMenuToggle, activeSectionTitle = 'Overview' }) {
  const { user, role, logout, switchRoleQuick } = useAuth()
  const { notifications, unreadCount, markAllAsRead } = useNotification()
  const navigate = useNavigate()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifyOpen, setIsNotifyOpen] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)

  const profileRef = useRef(null)
  const notifyRef = useRef(null)
  const roleRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false)
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setIsNotifyOpen(false)
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setIsRoleMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRoleChange = (newRole) => {
    switchRoleQuick(newRole)
    setIsRoleMenuOpen(false)
    if (newRole === 'Student') navigate('/student')
    else if (newRole === 'Teacher') navigate('/teacher')
    else if (newRole === 'Admin') navigate('/admin')
  }

  const roleColors = {
    Student: 'cyan',
    Teacher: 'violet',
    Admin: 'emerald',
  }

  const roleIcons = {
    Student: GraduationCap,
    Teacher: BookOpen,
    Admin: Shield,
  }

  const CurrentRoleIcon = roleIcons[role] || Shield

  return (
    <header className="sticky top-0 z-30 h-16 w-full glass-panel border-b border-white/[0.08] px-4 md:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Section Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Mechora AI</span>
            <span>/</span>
            <span className="text-slate-300 font-semibold">{role} Portal</span>
            <span>/</span>
          </div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-tight">
            {activeSectionTitle}
          </h1>
        </div>
      </div>

      {/* Right: Quick Role Switcher, Notifications & Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Instant Role Switcher (Apple pill design) */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-200 transition-all cursor-pointer"
          >
            <CurrentRoleIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium hidden sm:inline">{role} Mode</span>
            <Badge variant={roleColors[role]} size="sm" dot>
              Active
            </Badge>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {isRoleMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown border border-white/15 p-2 shadow-2xl z-50 text-xs"
              >
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                  Switch Role Dashboard
                </div>

                <div className="p-1 space-y-1 mt-1">
                  {[
                    { name: 'Student', icon: GraduationCap, color: 'text-cyan-400', desc: 'AI Assistant & Specs' },
                    { name: 'Teacher', icon: BookOpen, color: 'text-purple-400', desc: 'Question Review & Docs' },
                    { name: 'Admin', icon: Shield, color: 'text-emerald-400', desc: 'Users & System Health' },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleRoleChange(item.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                        role === item.name
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <div className="text-left">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      {role === item.name && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setIsNotifyOpen(!isNotifyOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}
          </button>

          <AnimatePresence>
            {isNotifyOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl glass-dropdown border border-white/15 p-4 shadow-2xl z-50"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl transition-all border ${
                        item.read
                          ? 'bg-white/[0.02] border-white/[0.04] text-slate-400'
                          : 'bg-white/[0.06] border-white/[0.1] text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-white">{item.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/[0.06] transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user?.full_name}
              className="w-8 h-8 rounded-full object-cover border border-cyan-400/30"
            />
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400">{user?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 rounded-2xl glass-dropdown border border-white/15 p-3 shadow-2xl z-50 text-xs"
              >
                <div className="p-2 border-b border-white/[0.08]">
                  <p className="font-semibold text-white text-sm">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <p className="text-[10px] text-cyan-400 mt-0.5">{user?.department}</p>
                </div>

                <div className="p-1 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false)
                      // Navigate to profile tab
                      const event = new CustomEvent('nav-tab-select', { detail: 'profile' })
                      window.dispatchEvent(event)
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all text-left"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>My Profile & Settings</span>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-300 hover:bg-rose-500/15 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
