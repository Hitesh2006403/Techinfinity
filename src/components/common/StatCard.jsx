import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { triggerNumberRoll } from '../../utils/animations'
import { cn } from '../../utils/cn'

export function StatCard({
  title,
  value,
  numericValue,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = 'text-cyan-400',
  iconBg = 'bg-cyan-500/10 border-cyan-500/20',
  glow = 'cyan',
  subtext,
  className = '',
}) {
  const valueRef = useRef(null)

  useEffect(() => {
    if (numericValue !== undefined && valueRef.current) {
      triggerNumberRoll(valueRef.current, numericValue)
    }
  }, [numericValue])

  return (
    <GlassCard glow={glow} className={cn('p-5 flex flex-col justify-between overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {numericValue !== undefined ? (
                <span ref={valueRef}>0</span>
              ) : (
                value
              )}
            </h3>
          </div>
        </div>

        {Icon && (
          <div className={cn('p-3 rounded-2xl border shadow-inner', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        {change && (
          <div
            className={cn(
              'flex items-center gap-1 font-medium px-2 py-0.5 rounded-full',
              isPositive
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
        <span className="text-slate-400 truncate">{subtext || 'Live update'}</span>
      </div>
    </GlassCard>
  )
}
