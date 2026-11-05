import React, { useState } from 'react'
import { UploadCloud, File, CheckCircle2, AlertCircle, Cpu, Loader2 } from 'lucide-react'
import { Modal } from '../common/Modal'
import { AnimatedButton } from '../common/AnimatedButton'
import { useNotification } from '../../context/NotificationContext'
import { manualsAPI } from '../../services/api'

export function UploadDocumentModal({ isOpen, onClose, machines = [], onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [machineId, setMachineId] = useState(machines[0]?.machine_id || 'M-HP200')
  const [documentName, setDocumentName] = useState('')
  const [revision, setRevision] = useState('1.0')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useNotification()

  const handleFileDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0]
      setFile(selected)
      if (!documentName) {
        setDocumentName(selected.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      if (!documentName) {
        setDocumentName(selected.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !machineId || !documentName) {
      toast.error('Please attach a PDF file, assign a machine, and name the document.')
      return
    }

    setIsUploading(true)
    setUploadProgress(20)

    try {
      // Simulate stepped progress
      setTimeout(() => setUploadProgress(50), 300)
      setTimeout(() => setUploadProgress(85), 700)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('machine_id', machineId)
      formData.append('document_name', documentName)
      formData.append('revision', revision)
      formData.append('document_id', `${machineId}-${documentName.slice(0, 10).toUpperCase().replace(/\s+/g, '_')}-r${revision}`)

      const result = await manualsAPI.uploadManual(formData)

      setUploadProgress(100)
      toast.success(`"${documentName}" uploaded and queued for vector chunking!`)
      if (onUploadSuccess) onUploadSuccess(result)
      onClose()

      // Reset form
      setFile(null)
      setDocumentName('')
      setRevision('1.0')
      setUploadProgress(0)
    } catch (err) {
      toast.error(err.message || 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Industrial Manual & Knowledge"
      subtitle="Ingests PDF documents directly into the local RAG vector pipeline for AI citation."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-6 text-center transition-all bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer relative"
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            {file ? (
              <div>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white">Click or drag manual PDF here</p>
                <p className="text-xs text-slate-400">Supports PDF, DOCX (Max 50MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Machine Assignment */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Target Machine</label>
          <select
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
          >
            {machines.map((m) => (
              <option key={m.machine_id} value={m.machine_id}>
                {m.machine_id} — {m.machine_name}
              </option>
            ))}
          </select>
        </div>

        {/* Document Title & Revision */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Document Title</label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Operations & Maintenance"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Revision</label>
            <input
              type="text"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="1.0"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Progress Bar during upload */}
        {isUploading && (
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Embedding chunks into vector store...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.08]">
          <AnimatedButton variant="ghost" size="sm" onClick={onClose} disabled={isUploading}>
            Cancel
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isUploading}
            disabled={!file}
          >
            Start Vector Ingestion
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  )
}
