import React from 'react'
import { cn } from '../../utils/cn'

export function Badge({
  children,
  variant = 'cyan', // 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
  size = 'sm', // 'sm' | 'md'
  dot = false,
  className = '',
}) {
  const variantClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
    violet: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    slate: 'bg-slate-500/15 text-slate-300 border-white/10',
  }

  const dotClasses = {
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    violet: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    rose: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
    slate: 'bg-slate-400',
  }

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border backdrop-blur-md select-none',
        variantClasses[variant] || variantClasses.slate,
        sizeClasses[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotClasses[variant])} />}
      <span>{children}</span>
    </span>
  )
}
