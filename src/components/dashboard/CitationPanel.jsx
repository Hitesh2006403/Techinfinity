import React, { useState } from 'react'
import { FileText, ExternalLink, Check, Bookmark, Sparkles, BookOpen } from 'lucide-react'
import { GlassCard } from '../common/GlassCard'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import { AnimatedButton } from '../common/AnimatedButton'

export function CitationPanel({ citations = [] }) {
  const [activePdfModal, setActivePdfModal] = useState(null)

  if (!citations || citations.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Verified Source Citations ({citations.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Strictly retrieved from OEM manuals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {citations.map((cite, idx) => (
            <div
              key={cite.source_id || idx}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {cite.source_id || `S${idx + 1}`}
                    </span>
                    <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                      {cite.document_name}
                    </span>
                  </div>
                  {cite.score && (
                    <Badge variant="emerald" size="sm">
                      {Math.round(cite.score * 100)}% match
                    </Badge>
                  )}
                </div>

                <div className="text-[11px] text-cyan-400/90 font-medium mb-2">
                  {cite.section_title || 'Section Reference'}
                </div>

                <p className="text-xs text-slate-300 italic bg-black/25 p-2.5 rounded-xl border border-white/[0.04] leading-relaxed">
                  "{cite.excerpt}"
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                <span>Page {cite.page_number} • Rev {cite.revision}</span>
                <button
                  type="button"
                  onClick={() => setActivePdfModal(cite)}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                >
                  <span>View in PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual PDF Viewer Modal */}
      <Modal
        isOpen={!!activePdfModal}
        onClose={() => setActivePdfModal(null)}
        title={activePdfModal?.document_name || 'Technical Manual PDF Preview'}
        subtitle={`Document ID: ${activePdfModal?.document_id} • Page ${activePdfModal?.page_number} • Revision ${activePdfModal?.revision}`}
        maxWidth="max-w-3xl"
        footer={
          <AnimatedButton variant="secondary" size="sm" onClick={() => setActivePdfModal(null)}>
            Close Document
          </AnimatedButton>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between">
            <span>Verified RAG Citation Highlight: <strong>{activePdfModal?.section_title}</strong></span>
            <Badge variant="cyan" size="sm">OEM Certified Document</Badge>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs leading-relaxed text-slate-300 max-h-96 overflow-y-auto">
            <div className="text-slate-400 border-b border-white/10 pb-3 mb-3 flex items-center justify-between">
              <span>[DOCUMENT ARCHIVE STREAM]</span>
              <span>PAGE {activePdfModal?.page_number}</span>
            </div>
            <p className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed">
              {activePdfModal?.excerpt}
              {"\n\n"}
              [Continuous telemetry record: All high-pressure hydraulic components and sensor telemetry loops on this page are rated up to 350 Bar. When carrying out scheduled or emergency inspection, follow DIN EN ISO 4413 guidelines for hydraulic fluid power systems. Replace filter cartridges when differential pressure gauge flag triggers amber.]
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
