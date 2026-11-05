import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  glow = 'none', // 'cyan' | 'violet' | 'blue' | 'none'
  onClick,
  ...props
}) {
  const glowClasses = {
    cyan: 'border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.08)] hover:border-cyan-500/40',
    violet: 'border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.08)] hover:border-purple-500/40',
    blue: 'border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.08)] hover:border-blue-500/40',
    none: 'border-white/[0.08]',
  }

  const Component = onClick || hoverEffect ? motion.div : 'div'
  const motionProps = onClick || hoverEffect ? {
    whileHover: { y: -2, transition: { duration: 0.2 } },
    whileTap: onClick ? { scale: 0.99 } : undefined,
  } : {}

  return (
    <Component
      onClick={onClick}
      className={cn(
        'relative rounded-2xl md:rounded-3xl p-5 md:p-6',
        'bg-slate-900/60 backdrop-blur-xl',
        'border transition-all duration-300',
        glowClasses[glow] || glowClasses.none,
        hoverEffect && 'cursor-pointer hover:bg-slate-800/50 hover:border-white/20',
        className
      )}
      {...motionProps}
      {...props}
    >
      {/* Subtle top glare highlight for realistic Apple glass finish */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-t-2xl" />
      {children}
    </Component>
  )
}
