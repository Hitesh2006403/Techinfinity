import React, { useState } from 'react'
import { Sparkles, Send, Cpu, Lightbulb, ChevronDown } from 'lucide-react'
import { GlassCard } from '../common/GlassCard'
import { AnimatedButton } from '../common/AnimatedButton'
import { Badge } from '../common/Badge'

export function QuestionInput({
  machines = [],
  selectedMachineId,
  onSelectMachine,
  onAsk,
  isLoading = false,
}) {
  const [question, setQuestion] = useState('')

  const quickQuestions = [
    'How do I clear emergency hydraulic alarm E-301?',
    'What are the oil change intervals and viscosity specs?',
    'Spindle thermal compensation procedure on Axis C',
    'Safety perimeter curtain bypass regulations',
  ]

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!question.trim() || isLoading) return
    onAsk({ machine_id: selectedMachineId, question: question.trim() })
  }

  const selectedMachine = machines.find((m) => m.machine_id === selectedMachineId) || machines[0]

  return (
    <GlassCard glow="cyan" className="p-6">
      {/* Machine selector header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Target Equipment</span>
            <div className="relative mt-0.5">
              <select
                value={selectedMachineId}
                onChange={(e) => onSelectMachine(e.target.value)}
                className="appearance-none bg-slate-900/80 text-white font-semibold text-sm rounded-xl pl-3 pr-8 py-1.5 border border-white/10 hover:border-cyan-500/40 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {machines.map((m) => (
                  <option key={m.machine_id} value={m.machine_id} className="bg-slate-900 text-white">
                    {m.machine_name} ({m.model})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {selectedMachine && (
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm" dot>
              {selectedMachine.manual_count || 1} Manuals Ingested
            </Badge>
            <Badge variant="emerald" size="sm">
              RAG Ready
            </Badge>
          </div>
        )}
      </div>

      {/* Main input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e)
              }
            }}
            placeholder={`Ask anything about ${selectedMachine?.model || 'the machine'} — operations, troubleshooting, wiring schematics, maintenance tolerances...`}
            className="w-full p-4 rounded-2xl glass-input text-sm leading-relaxed placeholder:text-slate-500 resize-none"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">⌘ + Enter to send</span>
            <AnimatedButton
              type="submit"
              variant="gradient"
              size="sm"
              iconRight={Send}
              isLoading={isLoading}
              disabled={!question.trim()}
            >
              Ask RAG AI
            </AnimatedButton>
          </div>
        </div>

        {/* Quick prompt suggestions */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggested questions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuestion(q)}
                className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </form>
    </GlassCard>
  )
}
