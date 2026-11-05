import React, { useState } from 'react'
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ShieldCheck,
  Bookmark,
  Share2,
} from 'lucide-react'
import { GlassCard } from '../common/GlassCard'
import { Badge } from '../common/Badge'
import { CitationPanel } from './CitationPanel'
import { useNotification } from '../../context/NotificationContext'

export function AIAnswerPanel({ answer, citations = [], teacherNote = '', status = 'ANSWERED' }) {
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [feedback, setFeedback] = useState(null) // 'up' | 'down' | null
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useNotification()

  if (!answer) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(answer)
    setCopied(true)
    toast.success('Answer copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      toast.warning('Speech synthesis not supported in this browser')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      // Clean markdown tags for spoken text
      const cleanText = answer.replace(/[#*`>_]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = 1.0
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
      toast.info('Reading answer aloud...')
    }
  }

  const handleFeedback = (type) => {
    setFeedback(type)
    toast.success(type === 'up' ? 'Feedback recorded! Marked as helpful.' : 'Feedback recorded! Sent to teacher review queue.')
  }

  return (
    <GlassCard glow="cyan" className="p-6 md:p-7 space-y-6">
      {/* Answer Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Industrial RAG Synthesis</span>
              <Badge variant="cyan" size="sm">
                Strict Grounding
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-400">Derived strictly from ingested machinery manuals</p>
          </div>
        </div>

        {/* Action button toolbar */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.06]">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy answer"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleSpeech}
            title={isSpeaking ? 'Stop speaking' : 'Read answer aloud'}
            className={`p-2 rounded-xl transition-colors ${
              isSpeaking ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSaved(!isSaved)
              toast.success(!isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks')
            }}
            title="Bookmark solution"
            className={`p-2 rounded-xl transition-colors ${
              isSaved ? 'text-amber-400 bg-amber-500/20' : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => handleFeedback('up')}
            title="Helpful response"
            className={`p-2 rounded-xl transition-colors ${
              feedback === 'up' ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleFeedback('down')}
            title="Needs clarification"
            className={`p-2 rounded-xl transition-colors ${
              feedback === 'down' ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Answer Body Renderer */}
      <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-3 font-normal">
        {answer.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('###')) {
            return (
              <h4 key={idx} className="text-base font-bold text-white pt-2 border-b border-white/5 pb-1">
                {paragraph.replace(/^###\s*/, '')}
              </h4>
            )
          }
          if (paragraph.startsWith('>')) {
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs my-2 flex items-start gap-2.5"
              >
                <span className="font-bold">⚠️ Notice:</span>
                <span>{paragraph.replace(/^>\s*/, '')}</span>
              </div>
            )
          }
          if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
            return (
              <div key={idx} className="pl-2 space-y-1 my-2">
                {paragraph.split('\n').map((line, lIdx) => (
                  <div key={lIdx} className="flex items-start gap-2 text-xs md:text-sm text-slate-300">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{line.replace(/^[-*0-9.]+\s*/, '')}</span>
                  </div>
                ))}
              </div>
            )
          }
          return (
            <p key={idx} className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {paragraph}
            </p>
          )
        })}
      </div>

      {/* Teacher Explanation / Endorsement Note if provided */}
      {teacherNote && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Faculty Review & Endorsement</span>
          </div>
          <p className="text-xs text-purple-100/90 leading-relaxed italic">{teacherNote}</p>
        </div>
      )}

      {/* Citations Footer */}
      <CitationPanel citations={citations} />
    </GlassCard>
  )
}
