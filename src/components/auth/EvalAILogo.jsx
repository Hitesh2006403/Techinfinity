import React from 'react'
import { GraduationCap, Sparkles } from 'lucide-react'

export function EvalAILogo({ size = 'md', showSubtitle = true, className = '' }) {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-3xl',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Apple-style gradient icon container */}
      <div
        className={`relative ${iconSizes[size]} bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20 shrink-0`}
      >
        <GraduationCap className="w-3/5 h-3/5 text-white stroke-[2.2]" />
        {/* Subtle AI spark badge */}
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-400 flex items-center justify-center shadow-sm">
          <Sparkles className="w-2.5 h-2.5 text-slate-950" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight ${textSizes[size]} text-slate-900 dark:text-white`}>
            Eval<span className="text-blue-600 dark:text-blue-400">AI</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight mt-0.5">
            Explainable AI Assessment Platform
          </span>
        )}
      </div>
    </div>
  )
}
