import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { GlassCard } from '../components/common/GlassCard'
import { AnimatedButton } from '../components/common/AnimatedButton'

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#07090e] bg-mesh-gradient flex items-center justify-center p-6 text-slate-100">
      <GlassCard glow="cyan" className="p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">404 — Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested dashboard view does not exist or requires different clearance permissions.
        </p>
        <div className="pt-2">
          <Link to="/">
            <AnimatedButton variant="primary" size="sm" iconLeft={ArrowLeft} className="w-full">
              Return to Role Hub
            </AnimatedButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
