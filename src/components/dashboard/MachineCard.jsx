import React from 'react'
import { motion } from 'framer-motion'
import { Cpu, Zap, Gauge, Calendar, BookOpen, ArrowUpRight, Wrench } from 'lucide-react'
import { GlassCard } from '../common/GlassCard'
import { Badge } from '../common/Badge'
import { AnimatedButton } from '../common/AnimatedButton'

export function MachineCard({ machine, onAskAI, onViewDetails }) {
  const statusVariants = {
    operational: { badge: 'emerald', label: 'Operational' },
    maintenance: { badge: 'amber', label: 'In Maintenance' },
    calibrating: { badge: 'cyan', label: 'Calibrating' },
  }

  const currentStatus = statusVariants[machine.status] || statusVariants.operational

  return (
    <GlassCard glow="none" hoverEffect className="p-0 overflow-hidden flex flex-col justify-between group">
      {/* Top Image Preview */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-950">
        <img
          src={machine.image}
          alt={machine.machine_name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d111c] via-transparent to-transparent" />

        {/* Floating status & model tags */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono font-bold text-cyan-300">
            {machine.machine_id}
          </span>
          <Badge variant={currentStatus.badge} size="sm" dot>
            {currentStatus.label}
          </Badge>
        </div>

        {/* Bottom category label */}
        <div className="absolute bottom-3 left-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
            {machine.category || 'Heavy Machinery'}
          </span>
          <h3 className="text-base font-bold text-white tracking-tight truncate max-w-[280px]">
            {machine.machine_name}
          </h3>
        </div>
      </div>

      {/* Card Content & Technical Specs */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {machine.description}
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-slate-400">Power Rating</p>
              <p className="font-semibold text-white">{machine.power_rating || '45 kW'}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-slate-400">Max Pressure</p>
              <p className="font-semibold text-white">{machine.max_pressure || '200 Bar'}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>{machine.manual_count || 1} Manuals</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onViewDetails && (
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(machine)}
              >
                Specs
              </AnimatedButton>
            )}
            {onAskAI && (
              <AnimatedButton
                variant="primary"
                size="sm"
                iconRight={ArrowUpRight}
                onClick={() => onAskAI(machine)}
              >
                Ask AI
              </AnimatedButton>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
