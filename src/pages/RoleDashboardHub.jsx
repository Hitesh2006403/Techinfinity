import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { GlassCard } from '../components/common/GlassCard'
import { useAuth } from '../context/AuthContext'

const portalCards = [
  {
    name: 'Student',
    path: '/student',
    accent: 'cyan',
    description: 'View assignments, ask AI questions, and explore machine manuals.',
    feature: 'Learning Hub',
    icon: GraduationCap,
    stats: ['AI assistant', 'Lab access', 'Saved answers'],
  },
  {
    name: 'Teacher',
    path: '/teacher',
    accent: 'violet',
    description: 'Review student questions, upload manuals, and monitor AI quality.',
    feature: 'Faculty Portal',
    icon: BookOpen,
    stats: ['Review queue', 'Manual indexing', 'Course analytics'],
  },
  {
    name: 'Admin',
    path: '/admin',
    accent: 'emerald',
    description: 'Manage users, system health, documents, and platform telemetry.',
    feature: 'Command Center',
    icon: ShieldCheck,
    stats: ['User control', 'Fleet registry', 'System metrics'],
  },
]

export function RoleDashboardHub() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-12">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            Mechora AI Portals
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            Choose a dashboard
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
            Access the dedicated workspace for Student, Teacher, and Admin workflows.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {portalCards.map(({ name, path, accent, description, feature, icon: Icon, stats }) => (
            <motion.div
              key={name}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard
                glow={accent}
                hoverEffect
                onClick={() => navigate(path)}
                className="h-full cursor-pointer border border-white/10 bg-slate-900/60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/70">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    {feature}
                  </span>
                </div>

                <div className="mt-6">
                  <h2 className="text-2xl font-bold text-white">{name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
                </div>

                <div className="mt-6 space-y-2">
                  {stats.map((stat) => (
                    <div key={stat} className="flex items-center gap-2 text-sm text-slate-200">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      {stat}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {user?.role === name ? 'Current role' : 'Open portal'}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(path)
                    }}
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
