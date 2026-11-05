import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export function AnimatedButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient'
  size = 'md', // 'sm' | 'md' | 'lg'
  iconLeft: IconLeft,
  iconRight: IconRight,
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 font-medium',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2 font-medium',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5 font-semibold',
  }

  const variantClasses = {
    primary:
      'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] border border-cyan-400/40',
    secondary:
      'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 shadow-sm backdrop-blur-md',
    gradient:
      'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium shadow-[0_0_24px_rgba(56,189,248,0.35)] border border-white/20',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50',
  }

  return (
    <motion.button
      type={type}
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center transition-colors select-none cursor-pointer',
        sizeClasses[size],
        variantClasses[variant],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {IconLeft && <IconLeft className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {IconRight && <IconRight className="w-4 h-4 shrink-0" />}
        </>
      )}
    </motion.button>
  )
}
