import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Bot,
  Cpu,
  History,
  User,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Pin,
  ExternalLink,
  Shield,
  Layers,
  Wrench,
  Download,
  KeyRound,
  Bell,
  Sliders,
  Bookmark,
} from 'lucide-react'
import { DashboardLayout } from '../../components/common/DashboardLayout'
import { GlassCard } from '../../components/common/GlassCard'
import { StatCard } from '../../components/common/StatCard'
import { AnimatedButton } from '../../components/common/AnimatedButton'
import { SearchBar } from '../../components/common/SearchBar'
import { Badge } from '../../components/common/Badge'
import { Modal } from '../../components/common/Modal'
import { QuestionInput } from '../../components/dashboard/QuestionInput'
import { AIAnswerPanel } from '../../components/dashboard/AIAnswerPanel'
import { MachineCard } from '../../components/dashboard/MachineCard'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { machinesAPI, assistantAPI, manualsAPI } from '../../services/api'

export function StudentDashboard() {
  const { user, updateProfile } = useAuth()
  const { toast } = useNotification()

  const [activeTab, setActiveTab] = useState('overview')
  const [machines, setMachines] = useState([])
  const [selectedMachineId, setSelectedMachineId] = useState('M-HP200')
  const [historyItems, setHistoryItems] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [machineSearch, setMachineSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // AI Assistant states
  const [currentAnswer, setCurrentAnswer] = useState(null)
  const [currentCitations, setCurrentCitations] = useState([])
  const [currentTeacherNote, setCurrentTeacherNote] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [selectedMachineModal, setSelectedMachineModal] = useState(null)

  // Profile states
  const [fullName, setFullName] = useState(user?.full_name || 'Alex Turner')
  const [email, setEmail] = useState(user?.email || 'alex.turner@industrial.edu')
  const [department, setDepartment] = useState(user?.department || 'Mechatronics & Robotics Engineering')
  const [passwordState, setPasswordState] = useState({ current: '', new: '', confirm: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [mList, hList] = await Promise.all([
        machinesAPI.getMachines(),
        assistantAPI.getHistory(),
      ])
      setMachines(mList)
      if (mList.length > 0) setSelectedMachineId(mList[0].machine_id)
      setHistoryItems(hList)

      // Pre-load latest answer in assistant
      if (hList.length > 0) {
        setCurrentAnswer(hList[0].answer_text)
        setCurrentCitations(hList[0].citations || [])
        setCurrentTeacherNote(hList[0].teacher_note || '')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAskQuestion = async ({ machine_id, question }) => {
    setIsAsking(true)
    try {
      const response = await assistantAPI.askQuestion({ machine_id, question })
      setCurrentAnswer(response.answer)
      setCurrentCitations(response.sources || [])
      setCurrentTeacherNote('')
      toast.success('RAG response synthesized successfully!')

      // Refresh history
      const updatedHistory = await assistantAPI.getHistory()
      setHistoryItems(updatedHistory)
    } catch (err) {
      toast.error(err.message || 'Error processing AI query')
    } finally {
      setIsAsking(false)
    }
  }

  const handleSelectHistoryItem = (item) => {
    setSelectedMachineId(item.machine_id)
    setCurrentAnswer(item.answer_text)
    setCurrentCitations(item.citations || [])
    setCurrentTeacherNote(item.teacher_note || '')
    setActiveTab('assistant')
    toast.info(`Loaded query: "${item.title || item.question_text}"`)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    updateProfile({ full_name: fullName, email, department })
    toast.success('Student profile updated successfully!')
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (!passwordState.new || passwordState.new !== passwordState.confirm) {
      toast.error('New passwords do not match')
      return
    }
    toast.success('Password updated successfully')
    setPasswordState({ current: '', new: '', confirm: '' })
  }

  // Filtered Machines
  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.machine_name.toLowerCase().includes(machineSearch.toLowerCase()) ||
      m.machine_id.toLowerCase().includes(machineSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(machineSearch.toLowerCase())
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory
    return matchesSearch && matchesCat
  })

  // Filtered History
  const filteredHistory = historyItems.filter((h) =>
    h.question_text.toLowerCase().includes(historySearch.toLowerCase()) ||
    (h.title && h.title.toLowerCase().includes(historySearch.toLowerCase()))
  )

  const sectionTitles = {
    overview: 'Student Learning Hub',
    assistant: 'AI Industrial Assistant (RAG)',
    machines: 'Machine Library & Manuals',
    history: 'Question History & Insights',
    profile: 'Student Account & Settings',
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
          <GlassCard glow="cyan" className="p-6 md:p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <Badge variant="cyan" size="sm" dot>
                    Active Semester
                  </Badge>
                  <span className="text-xs text-slate-400">ID: {user?.student_id || 'STU-2025-8842'}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Welcome back, {user?.full_name?.split(' ')[0] || 'Alex'}! 👋
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Explore industrial machine manuals, diagnose error codes in seconds with RAG intelligence, and prepare for your lab sessions.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <AnimatedButton
                    variant="primary"
                    size="md"
                    iconLeft={Bot}
                    onClick={() => setActiveTab('assistant')}
                  >
                    Ask AI Assistant
                  </AnimatedButton>
                  <AnimatedButton
                    variant="secondary"
                    size="md"
                    iconLeft={Cpu}
                    onClick={() => setActiveTab('machines')}
                  >
                    Explore Machines
                  </AnimatedButton>
                </div>
              </div>

              {/* Learning Progress Ring / Widget */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center gap-5 shrink-0">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      className="stroke-white/10"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      className="stroke-cyan-400 transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={200}
                      strokeDashoffset={200 - (200 * 78) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute font-bold text-lg text-white">78%</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Syllabus Mastery
                  </h4>
                  <p className="text-sm font-bold text-white mt-0.5">Heavy Machinery</p>
                  <p className="text-[11px] text-cyan-400 mt-1">14 modules completed</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Questions Asked"
              numericValue={24}
              change="+6 this week"
              isPositive
              icon={Bot}
              glow="cyan"
              subtext="RAG verified"
            />
            <StatCard
              title="Machines Explored"
              numericValue={machines.length || 4}
              change="Full fleet"
              isPositive
              icon={Cpu}
              glow="violet"
              iconColor="text-purple-400"
              iconBg="bg-purple-500/10 border-purple-500/20"
              subtext="4 Active in Lab"
            />
            <StatCard
              title="Saved Solutions"
              numericValue={12}
              change="+2 new"
              isPositive
              icon={Bookmark}
              glow="blue"
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10 border-blue-500/20"
              subtext="Bookmarks"
            />
            <StatCard
              title="Learning Streak"
              value="5 Days"
              change="Personal record"
              isPositive
              icon={TrendingUp}
              glow="cyan"
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              subtext="Daily active"
            />
          </div>

          {/* Dual Column: Recent Activities & Quick Lab Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Activity & Previous Answers */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Recent AI Queries & Answers</h3>
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  View all ({historyItems.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {historyItems.slice(0, 3).map((item) => (
                  <GlassCard
                    key={item.id}
                    hoverEffect
                    onClick={() => handleSelectHistoryItem(item)}
                    className="p-5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" size="sm">
                          {item.machine_id}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {item.teacher_note && (
                          <Badge variant="violet" size="sm">
                            Teacher Reviewed
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">
                        {item.title || item.question_text}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {item.answer_text.replace(/###/g, '')}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.04] text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Right Col: Quick Access Machines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Recommended Lab Units</h3>
                <span className="text-xs text-slate-400">Available</span>
              </div>

              <div className="space-y-3">
                {machines.slice(0, 2).map((m) => (
                  <GlassCard key={m.machine_id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.image}
                        alt={m.machine_name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10"
                      />
                      <div className="truncate">
                        <p className="text-xs font-mono text-cyan-400 font-bold">{m.machine_id}</p>
                        <h4 className="text-sm font-bold text-white truncate">{m.machine_name}</h4>
                        <p className="text-[10px] text-slate-400">{m.category}</p>
                      </div>
                    </div>
                    <AnimatedButton
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedMachineId(m.machine_id)
                        setActiveTab('assistant')
                      }}
                    >
                      Start Assistant Session
                    </AnimatedButton>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI LEARNING ASSISTANT TAB */}
      {activeTab === 'assistant' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>AI Engineering & Machine Assistant</span>
                <Badge variant="cyan" size="sm" dot>
                  RAG Pipeline Active
                </Badge>
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Powered by vector semantic search over official OEM manuals with citation traceability.
              </p>
            </div>
          </div>

          {/* Interactive Question Input Box */}
          <QuestionInput
            machines={machines}
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
            onAsk={handleAskQuestion}
            isLoading={isAsking}
          />

          {/* AI Response Panel */}
          {currentAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AIAnswerPanel
                answer={currentAnswer}
                citations={currentCitations}
                teacherNote={currentTeacherNote}
              />
            </motion.div>
          )}

          {/* Quick History Drawer at Bottom */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Recent Machine Conversations
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Click to reload answer</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {historyItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-all group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                      {item.machine_id}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 line-clamp-1">
                    {item.title || item.question_text}
                  </p>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* 3. MACHINE LEARNING RESOURCES TAB */}
      {activeTab === 'machines' && (
        <div className="space-y-6">
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Industrial Equipment Library
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Inspect high-power machines, view schematics, and query connected documentation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SearchBar
                value={machineSearch}
                onChange={setMachineSearch}
                placeholder="Search machines or specs..."
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'Forming & Stamping', 'Pneumatics & Power', 'Machining & Tooling', 'Robotics & Automation'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {cat === 'ALL' ? 'All Equipment' : cat}
              </button>
            ))}
          </div>

          {/* Machine Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredMachines.map((machine) => (
              <MachineCard
                key={machine.machine_id}
                machine={machine}
                onAskAI={(m) => {
                  setSelectedMachineId(m.machine_id)
                  setActiveTab('assistant')
                }}
                onViewDetails={(m) => setSelectedMachineModal(m)}
              />
            ))}
          </div>

          {/* Machine Specs Modal */}
          <Modal
            isOpen={!!selectedMachineModal}
            onClose={() => setSelectedMachineModal(null)}
            title={selectedMachineModal?.machine_name || 'Machine Specifications'}
            subtitle={`Machine ID: ${selectedMachineModal?.machine_id} • Model: ${selectedMachineModal?.model}`}
            maxWidth="max-w-2xl"
            footer={
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedMachineId(selectedMachineModal.machine_id)
                  setSelectedMachineModal(null)
                  setActiveTab('assistant')
                }}
              >
                Open Assistant for this Machine
              </AnimatedButton>
            }
          >
            {selectedMachineModal && (
              <div className="space-y-4">
                <img
                  src={selectedMachineModal.image}
                  alt={selectedMachineModal.machine_name}
                  className="w-full h-56 object-cover rounded-2xl border border-white/10"
                />

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedMachineModal.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase">Power</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedMachineModal.power_rating}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase">Max Rating</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedMachineModal.max_pressure}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase">Last Serviced</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedMachineModal.last_serviced}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                  <span className="font-bold">Connected Manuals:</span> {selectedMachineModal.manual_count || 1} official technical manuals ingested. Real-time RAG context retrieval is enabled.
                </div>
              </div>
            )}
          </Modal>
        </div>
      )}

      {/* 4. STUDENT HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Question & Solution Archive
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Review your previous queries, faculty annotations, and bookmarked procedures.
              </p>
            </div>

            <SearchBar
              value={historySearch}
              onChange={setHistorySearch}
              placeholder="Search previous questions..."
            />
          </div>

          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <GlassCard key={item.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="cyan" size="sm">
                        {item.machine_id}
                      </Badge>
                      <span className="text-xs text-slate-400">{item.machine_name}</span>
                      <span className="text-[11px] text-slate-400">• {new Date(item.created_at).toLocaleString()}</span>
                      {item.is_pinned && <Badge variant="amber" size="sm">Pinned</Badge>}
                    </div>
                    <h3 className="text-base font-bold text-white">{item.title || item.question_text}</h3>
                  </div>

                  <AnimatedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectHistoryItem(item)}
                  >
                    Load in AI
                  </AnimatedButton>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.06] text-xs text-slate-300 leading-relaxed font-sans">
                  {item.answer_text.slice(0, 240)}...
                </div>

                {item.teacher_note && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                    <strong>Teacher Feedback:</strong> {item.teacher_note}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* 5. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Student Profile & Account Settings
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Manage your engineering credentials, course enrollment, and platform notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Card: Student ID card */}
            <GlassCard glow="cyan" className="p-6 text-center space-y-4 flex flex-col items-center">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                alt={user?.full_name}
                className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{user?.full_name}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant="cyan" size="sm" dot>
                    Verified Student
                  </Badge>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-white/[0.08] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Student ID:</span>
                  <span className="font-mono text-white font-semibold">{user?.student_id || 'STU-2025-8842'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-slate-200 truncate max-w-[140px]">{department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Academic Year:</span>
                  <span className="text-slate-200">Year 3 (Sem 5)</span>
                </div>
              </div>
            </GlassCard>

            {/* Right 2 Cols: Edit info & Password */}
            <div className="md:col-span-2 space-y-6">
              <GlassCard className="p-6">
                <h3 className="text-base font-bold text-white mb-4">Personal Information</h3>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Institutional Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <AnimatedButton type="submit" variant="primary" size="sm">
                      Save Profile Changes
                    </AnimatedButton>
                  </div>
                </form>
              </GlassCard>

              {/* Change Password */}
              <GlassCard className="p-6">
                <h3 className="text-base font-bold text-white mb-4">Security & Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Current Password</label>
                    <input
                      type="password"
                      value={passwordState.current}
                      onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">New Password</label>
                      <input
                        type="password"
                        value={passwordState.new}
                        onChange={(e) => setPasswordState({ ...passwordState, new: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Confirm Password</label>
                      <input
                        type="password"
                        value={passwordState.confirm}
                        onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <AnimatedButton type="submit" variant="secondary" size="sm">
                      Update Password
                    </AnimatedButton>
                  </div>
                </form>
              </GlassCard>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
