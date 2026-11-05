import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  LayoutDashboard,
  HelpCircle,
  FolderGit2,
  BarChart3,
  User,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Plus,
  Search,
  Filter,
  FileText,
  Trash2,
  Cpu,
  MessageSquare,
  ShieldCheck,
  Send,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { DashboardLayout } from '../../components/common/DashboardLayout'
import { GlassCard } from '../../components/common/GlassCard'
import { StatCard } from '../../components/common/StatCard'
import { AnimatedButton } from '../../components/common/AnimatedButton'
import { SearchBar } from '../../components/common/SearchBar'
import { Badge } from '../../components/common/Badge'
import { Modal } from '../../components/common/Modal'
import { UploadDocumentModal } from '../../components/dashboard/UploadDocumentModal'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { machinesAPI, assistantAPI, manualsAPI } from '../../services/api'

export function TeacherDashboard() {
  const { user, updateProfile } = useAuth()
  const { toast } = useNotification()

  const [activeTab, setActiveTab] = useState('overview')
  const [questions, setQuestions] = useState([])
  const [manuals, setManuals] = useState([])
  const [machines, setMachines] = useState([])

  // Question review modal
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [teacherExplanation, setTeacherExplanation] = useState('')
  const [questionFilter, setQuestionFilter] = useState('ALL') // 'ALL' | 'PENDING' | 'REVIEWED'
  const [searchQuery, setSearchQuery] = useState('')

  // Upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || 'Prof. Marcus Vance')
  const [email, setEmail] = useState(user?.email || 'marcus.vance@industrial.edu')
  const [department, setDepartment] = useState(user?.department || 'Department of Mechanical Engineering')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [qList, mList, macList] = await Promise.all([
        assistantAPI.getAllQuestionsForTeacher(),
        manualsAPI.getManuals(),
        machinesAPI.getMachines(),
      ])
      setQuestions(qList)
      setManuals(mList)
      setMachines(macList)
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenReview = (q) => {
    setSelectedQuestion(q)
    setTeacherExplanation(q.teacher_note || '')
  }

  const handleSaveTeacherNote = async () => {
    if (!selectedQuestion) return
    try {
      await assistantAPI.addTeacherReview(selectedQuestion.id, teacherExplanation, true)
      toast.success('Teacher explanation and verification saved!')
      setSelectedQuestion(null)
      loadData()
    } catch (err) {
      toast.error('Failed to update question')
    }
  }

  const handleDeleteManual = async (id) => {
    try {
      await manualsAPI.deleteManual(id)
      toast.success('Manual removed from RAG index')
      loadData()
    } catch (err) {
      toast.error('Failed to remove manual')
    }
  }

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesFilter =
      questionFilter === 'ALL' ||
      (questionFilter === 'REVIEWED' && q.is_reviewed) ||
      (questionFilter === 'PENDING' && !q.is_reviewed)

    const matchesSearch =
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.machine_id.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Analytics mock datasets
  const questionTrendData = [
    { day: 'Mon', questions: 28, resolvedByAI: 26 },
    { day: 'Tue', questions: 42, resolvedByAI: 39 },
    { day: 'Wed', questions: 65, resolvedByAI: 60 },
    { day: 'Thu', questions: 54, resolvedByAI: 51 },
    { day: 'Fri', questions: 82, resolvedByAI: 78 },
    { day: 'Sat', questions: 35, resolvedByAI: 34 },
    { day: 'Sun', questions: 22, resolvedByAI: 21 },
  ]

  const machineInquiryData = [
    { name: 'HP-200 Press', queries: 48, fill: '#06b6d4' },
    { name: 'AC-90 Compressor', queries: 32, fill: '#3b82f6' },
    { name: 'CNC-500X', queries: 64, fill: '#8b5cf6' },
    { name: 'KR-12 Robot', queries: 29, fill: '#10b981' },
  ]

  const pendingCount = questions.filter((q) => !q.is_reviewed).length
  const answeredCount = questions.length

  const sectionTitles = {
    overview: 'Faculty Instruction Portal',
    questions: 'Student Question Oversight & Reviews',
    resources: 'Knowledge Base & Manual Ingestion',
    analytics: 'Classroom AI Analytics & Engagement',
    profile: 'Teacher Profile & Settings',
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeSectionTitle={sectionTitles[activeTab]}
    >
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <GlassCard glow="violet" className="p-6 md:p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <Badge variant="violet" size="sm" dot>
                    Faculty Portal
                  </Badge>
                  <span className="text-xs text-slate-400">ID: FAC-ENG-402</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Welcome, {user?.full_name || 'Prof. Marcus Vance'}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Monitor student engineering inquiries, review AI RAG generation quality, endorse factory explanations, and manage technical course materials.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <AnimatedButton
                    variant="primary"
                    size="md"
                    iconLeft={HelpCircle}
                    onClick={() => setActiveTab('questions')}
                  >
                    Review Inquiries ({pendingCount} pending)
                  </AnimatedButton>
                  <AnimatedButton
                    variant="secondary"
                    size="md"
                    iconLeft={Upload}
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Upload Manual
                  </AnimatedButton>
                </div>
              </div>

              {/* RAG Verification Score Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 text-right shrink-0">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  AI Grounding Accuracy
                </span>
                <p className="text-3xl font-extrabold text-cyan-400">98.4%</p>
                <p className="text-xs text-slate-300">0 Hallucinations flagged</p>
                <Badge variant="emerald" size="sm">
                  100% In-Scope Sources
                </Badge>
              </div>
            </div>
          </GlassCard>

          {/* Teacher Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Enrolled Students"
              numericValue={142}
              change="+14 new"
              isPositive
              icon={Users}
              glow="cyan"
              subtext="4 Active Lab Sections"
            />
            <StatCard
              title="Total Questions"
              numericValue={answeredCount + 1240}
              change="+38 today"
              isPositive
              icon={MessageSquare}
              glow="blue"
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10 border-blue-500/20"
              subtext="Handled via RAG"
            />
            <StatCard
              title="Awaiting Teacher Review"
              numericValue={pendingCount}
              change="Action needed"
              isPositive={false}
              icon={Clock}
              glow="violet"
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10 border-amber-500/20"
              subtext="Needs faculty note"
            />
            <StatCard
              title="Course Manuals"
              numericValue={manuals.length}
              change="Fully Indexed"
              isPositive
              icon={FolderGit2}
              glow="cyan"
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              subtext="Available in RAG"
            />
          </div>

          {/* Dual Column: Pending Question Feed & Trending Queries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Inquiries Queue */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Student Questions Requiring Review</h3>
                </div>
                <button
                  onClick={() => setActiveTab('questions')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Manage all ({questions.length})
                </button>
              </div>

              <div className="space-y-3">
                {questions.slice(0, 4).map((q) => (
                  <GlassCard
                    key={q.id}
                    hoverEffect
                    onClick={() => handleOpenReview(q)}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{q.student_name}</span>
                        <span className="text-[11px] text-slate-400">• {q.machine_id}</span>
                        {q.is_reviewed ? (
                          <Badge variant="emerald" size="sm">Reviewed</Badge>
                        ) : (
                          <Badge variant="amber" size="sm" dot>Pending Review</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate">
                        {q.question_text}
                      </p>
                    </div>

                    <AnimatedButton variant="secondary" size="sm">
                      Inspect & Review
                    </AnimatedButton>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Right Col: Machine Query Leaderboard */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Most Queried Machines</h3>

              <GlassCard className="p-5 space-y-4">
                {machineInquiryData.map((m) => (
                  <div key={m.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">{m.name}</span>
                      <span className="text-slate-400">{m.queries} queries</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(m.queries / 70) * 100}%`,
                          backgroundColor: m.fill,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs mt-2"
                  onClick={() => setActiveTab('analytics')}
                >
                  View Full Analytics Report →
                </AnimatedButton>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENT QUESTION MANAGEMENT TAB */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Student Question Management
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Inspect AI generated answers, verify citation validity, and attach authoritative faculty notes.
              </p>
            </div>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by student, question, or machine..."
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: `All Inquiries (${questions.length})` },
              { id: 'PENDING', label: `Pending Review (${pendingCount})` },
              { id: 'REVIEWED', label: `Reviewed (${questions.length - pendingCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setQuestionFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  questionFilter === f.id
                    ? 'bg-purple-600 text-white font-semibold shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Questions Grid/Table */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <GlassCard key={q.id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{q.student_name}</span>
                      <span className="text-xs text-slate-400">({q.student_email || 'student'})</span>
                      <Badge variant="cyan" size="sm">
                        {q.machine_id}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {new Date(q.created_at).toLocaleString()}
                      </span>
                      {q.is_reviewed ? (
                        <Badge variant="emerald" size="sm">
                          Reviewed by Teacher
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm" dot>
                          Pending Review
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white pt-1">
                      {q.question_text}
                    </h3>
                  </div>

                  <AnimatedButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenReview(q)}
                  >
                    Review Answer & Citations
                  </AnimatedButton>
                </div>

                {/* AI Answer Preview */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase mb-1">
                    [AI Generated RAG Response]
                  </div>
                  {q.answer_text.slice(0, 300)}...
                </div>

                {/* Teacher Note Display */}
                {q.teacher_note && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                    <span className="font-bold text-purple-300">Teacher Explanation Attached: </span>
                    {q.teacher_note}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>

          {/* Question Review Modal */}
          <Modal
            isOpen={!!selectedQuestion}
            onClose={() => setSelectedQuestion(null)}
            title="Inspect Question & AI Answer"
            subtitle={`Asked by ${selectedQuestion?.student_name} for ${selectedQuestion?.machine_id}`}
            maxWidth="max-w-3xl"
            footer={
              <div className="flex items-center gap-3">
                <AnimatedButton variant="ghost" size="sm" onClick={() => setSelectedQuestion(null)}>
                  Close
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  iconLeft={ShieldCheck}
                  onClick={handleSaveTeacherNote}
                >
                  Save & Mark as Reviewed
                </AnimatedButton>
              </div>
            }
          >
            {selectedQuestion && (
              <div className="space-y-5">
                {/* Question Info */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Student Query
                  </span>
                  <p className="text-sm font-bold text-white">{selectedQuestion.question_text}</p>
                </div>

                {/* Full AI Answer */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-cyan-400 font-mono font-semibold">
                    <span>AI RAG Answer</span>
                    <Badge variant="cyan" size="sm">Strict Context Grounded</Badge>
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {selectedQuestion.answer_text}
                  </div>
                </div>

                {/* Attached Citations */}
                {selectedQuestion.citations && selectedQuestion.citations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300 uppercase">
                      Ingested Sources Referenced ({selectedQuestion.citations.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedQuestion.citations.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300"
                        >
                          <div className="font-bold text-cyan-400">
                            {c.document_name} • Page {c.page_number}
                          </div>
                          <p className="italic text-slate-400 mt-1">"{c.excerpt}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Explanation Editor */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Provide Faculty Explanation & Feedback:</span>
                  </label>
                  <textarea
                    rows={4}
                    value={teacherExplanation}
                    onChange={(e) => setTeacherExplanation(e.target.value)}
                    placeholder="Add your technical commentary, safety reminders, or endorsement. This will be highlighted on the student's dashboard."
                    className="w-full p-3.5 rounded-2xl glass-input text-xs leading-relaxed text-slate-100"
                  />
                </div>
              </div>
            )}
          </Modal>
        </div>
      )}

      {/* 3. KNOWLEDGE & LEARNING RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Knowledge & Manual Management
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Upload OEM machine manuals and engineering textbooks to expand the student RAG knowledge base.
              </p>
            </div>

            <AnimatedButton
              variant="gradient"
              size="md"
              iconLeft={Upload}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload New Manual
            </AnimatedButton>
          </div>

          {/* Manuals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manuals.map((manual) => (
              <GlassCard key={manual.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="emerald" size="sm" dot>
                        RAG Active
                      </Badge>
                      <button
                        onClick={() => handleDeleteManual(manual.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {manual.document_id}
                    </span>
                    <h3 className="text-base font-bold text-white">{manual.document_name}</h3>
                    <p className="text-xs text-slate-400">
                      Associated with Machine: <strong>{manual.machine_id}</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                  <span>Rev {manual.revision} • {manual.total_chunks || 140} Vector Chunks</span>
                  <span>{new Date(manual.uploaded_at).toLocaleDateString()}</span>
                </div>
              </GlassCard>
            ))}
          </div>

          <UploadDocumentModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            machines={machines}
            onUploadSuccess={() => loadData()}
          />
        </div>
      )}

      {/* 4. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Student Engagement & Learning Analytics
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Visualize machine query frequency, peak activity hours, and student mastery curves.
            </p>
          </div>

          {/* Chart 1: Daily Question Volume */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Daily Inquiry Volume & AI Resolution</h3>
                <p className="text-xs text-slate-400">Weekly student traffic</p>
              </div>
              <Badge variant="cyan" size="sm">Real-time Telemetry</Badge>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={questionTrendData}>
                  <defs>
                    <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="questions"
                    name="Total Student Queries"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQuestions)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolvedByAI"
                    name="AI Grounded Answers"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAI)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Chart 2: Machine Query Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Machine Inquiries Distribution</h3>
              <p className="text-xs text-slate-400">Total queries by equipment model</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={machineInquiryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="queries" radius={[8, 8, 0, 0]} fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Key Diagnostic Trends</h3>
              <p className="text-xs text-slate-400">Frequently investigated topics</p>

              <div className="space-y-3 pt-2">
                {[
                  { topic: 'Hydraulic Valve Error Code E-301', pct: 42, color: 'bg-cyan-400' },
                  { topic: 'Spindle Thermal Compensation Macro', pct: 28, color: 'bg-purple-400' },
                  { topic: 'Rotary Compressor Oil Viscosity Specs', pct: 18, color: 'bg-blue-400' },
                  { topic: 'Perimeter Curtain Safety LOTO Protocol', pct: 12, color: 'bg-emerald-400' },
                ].map((item) => (
                  <div key={item.topic} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-medium">{item.topic}</span>
                      <span className="text-slate-400 font-semibold">{item.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 5. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Faculty Profile & Credentials
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Manage your teaching appointments, laboratory supervisor privileges, and account settings.
            </p>
          </div>

          <GlassCard glow="violet" className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'}
                alt={user?.full_name}
                className="w-24 h-24 rounded-full object-cover border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              />
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-white">{fullName}</h3>
                <p className="text-xs text-slate-400">{email}</p>
                <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                  <Badge variant="violet" size="sm" dot>
                    Professor of Mechanical Engineering
                  </Badge>
                  <Badge variant="cyan" size="sm">
                    Lab Director
                  </Badge>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateProfile({ full_name: fullName, email, department })
                toast.success('Teacher profile updated!')
              }}
              className="space-y-4 pt-4 border-t border-white/[0.08]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Academic Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <AnimatedButton type="submit" variant="primary" size="sm">
                  Save Faculty Credentials
                </AnimatedButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  )
}
