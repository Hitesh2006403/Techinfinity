import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Presentation, ShieldCheck } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export const ROLES = [
  {
    id: 'Student',
    label: 'Student',
    icon: GraduationCap,
    desc: 'Learner Portal',
    badge: 'Evaluation & Feedback',
  },
  {
    id: 'Teacher',
    label: 'Teacher',
    icon: Presentation,
    desc: 'Faculty Portal',
    badge: 'Rubrics & Review',
  },
  {
    id: 'Admin',
    label: 'Admin',
    icon: ShieldCheck,
    desc: 'Control Center',
    badge: 'System Governance',
  },
]

export function RoleSelector({ selectedRole, onSelectRole }) {
  const { isDark } = useTheme()

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <label className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
          Select Your Workspace
        </label>
        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
          3 Roles Available
        </span>
      </div>

      {/* Apple Segmented Control Container */}
      <div
        role="tablist"
        aria-label="User Role Selection"
        className={`relative p-1 rounded-2xl flex items-center transition-colors duration-200 border ${
          isDark
            ? 'bg-slate-950/70 border-slate-800/80 shadow-inner'
            : 'bg-slate-100/90 border-slate-200/80 shadow-inner'
        }`}
      >
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id
          const Icon = role.icon

          return (
            <button
              key={role.id}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isSelected
                  ? isDark
                    ? 'text-white'
                    : 'text-slate-900'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {/* Sliding Apple-style active highlight pill */}
              {isSelected && (
                <motion.div
                  layoutId="activeRoleIndicator"
                  className={`absolute inset-0 rounded-xl transition-shadow ${
                    isDark
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-[0_2px_12px_rgba(37,99,235,0.45)] border border-blue-400/30'
                      : 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.1)] border border-slate-200/80'
                  }`}
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isSelected
                      ? isDark
                        ? 'text-white scale-110'
                        : 'text-blue-600 scale-110'
                      : 'opacity-70'
                  }`}
                />
                <span className="font-semibold tracking-tight">{role.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
