import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Bot,
  Cpu,
  History,
  User,
  HelpCircle,
  FolderGit2,
  BarChart3,
  Users,
  FileCheck,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Database,
  Radio,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Badge } from './Badge'
import { cn } from '../../utils/cn'

export function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
  const { role } = useAuth()

  // Navigation configurations tailored strictly for each of the three roles
  const studentNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'assistant', label: 'AI Learning Assistant', icon: Bot, badge: 'RAG' },
    { id: 'machines', label: 'Machine Resources', icon: Cpu, badge: null },
    { id: 'history', label: 'Student History', icon: History, badge: null },
    { id: 'profile', label: 'Profile & Settings', icon: User, badge: null },
  ]

  const teacherNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'questions', label: 'Question Management', icon: HelpCircle, badge: '18' },
    { id: 'resources', label: 'Knowledge & Manuals', icon: FolderGit2, badge: null },
    { id: 'analytics', label: 'Class Analytics', icon: BarChart3, badge: null },
    { id: 'profile', label: 'Teacher Profile', icon: User, badge: null },
  ]

  const adminNavItems = [
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard, badge: null },
    { id: 'users', label: 'User Management', icon: Users, badge: '154' },
    { id: 'machines', label: 'Machine Fleet', icon: Cpu, badge: null },
    { id: 'documents', label: 'Document Ingestion', icon: FileCheck, badge: null },
    { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp, badge: null },
    { id: 'settings', label: 'System Settings', icon: Settings, badge: null },
  ]

  const navMap = {
    Student: studentNavItems,
    Teacher: teacherNavItems,
    Admin: adminNavItems,
  }

  const items = navMap[role] || studentNavItems

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4">
      {/* Brand & Logo */}
      <div>
        <div className="flex items-center justify-between pb-6 pt-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="truncate"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white">Mechora</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Industrial Intelligence</p>
              </motion.div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role identifier badge in sidebar */}
        {!isCollapsed && (
          <div className="my-4 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Current Role</span>
            <Badge
              variant={role === 'Student' ? 'cyan' : role === 'Teacher' ? 'violet' : 'emerald'}
              size="sm"
            >
              {role}
            </Badge>
          </div>
        )}

        {/* Navigation links */}
        <nav className="mt-4 space-y-1.5">
          {items.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id)
                  if (onCloseMobile) onCloseMobile()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all relative group cursor-pointer',
                  isActive
                    ? 'text-white bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.12)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                )}
              >
                {/* Active left indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute left-0 w-1 h-5 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-cyan-300">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* System Telemetry footer */}
      <div className="pt-4 border-t border-white/[0.08]">
        {!isCollapsed ? (
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                RAG Engine
              </span>
              <span className="font-semibold text-emerald-400">Online</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Local Demo Store</span>
              <span className="text-cyan-400">Browser storage</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:block sticky top-0 h-screen glass-panel border-r border-white/[0.08] transition-all duration-300 z-40 shrink-0',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 h-full glass-dropdown border-r border-white/10 z-10"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
