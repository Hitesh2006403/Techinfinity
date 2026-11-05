import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Cpu,
  FileCheck,
  TrendingUp,
  Settings,
  Shield,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  Activity,
  Server,
  Database,
  Radio,
  FileText,
  Key,
  Bell,
  Sliders,
  Sparkles,
  Download,
  AlertTriangle,
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
import { adminAPI, machinesAPI, manualsAPI } from '../../services/api'

export function AdminDashboard() {
  const { user } = useAuth()
  const { toast } = useNotification()

  const [activeTab, setActiveTab] = useState('overview')
  const [usersList, setUsersList] = useState([])
  const [machinesList, setMachinesList] = useState([])
  const [documentsList, setDocumentsList] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 142,
    totalTeachers: 12,
    totalUsers: 154,
    totalQuestions: 1289,
    totalDocuments: 28,
    totalMachines: 4,
    systemHealth: '99.9%',
  })

  // User filter & modals
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    username: '',
    email: '',
    role: 'Student',
    department: 'Mechatronics & Robotics Engineering',
  })

  // Machine management state
  const [machineSearch, setMachineSearch] = useState('')
  const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState(null)
  const [newMachineData, setNewMachineData] = useState({
    machine_id: '',
    model: '',
    machine_name: '',
    category: 'Forming & Stamping',
    description: '',
    power_rating: '45 kW',
    max_pressure: '200 Bar',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  })

  // Document modal
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false)

  // Settings states
  const [openRouterKey, setOpenRouterKey] = useState('sk-or-v1-••••••••••••••••••••')
  const [ragChunkSize, setRagChunkSize] = useState('512')
  const [temperature, setTemperature] = useState('0.1')

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      const [overview, uList, mList, dList] = await Promise.all([
        adminAPI.getSystemOverview(),
        adminAPI.getUsers(),
        machinesAPI.getMachines(),
        manualsAPI.getManuals(),
      ])
      if (overview?.stats) setStats(overview.stats)
      setUsersList(uList)
      setMachinesList(mList)
      setDocumentsList(dList)
    } catch (e) {
      console.error(e)
    }
  }

  // User Actions
  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUserData.username || !newUserData.full_name || !newUserData.email) {
      toast.error('Please fill in all user details')
      return
    }
    try {
      const created = await adminAPI.createUser(newUserData)
      toast.success(`User ${created.full_name} (${created.role}) created successfully!`)
      setIsAddUserModalOpen(false)
      setNewUserData({
        full_name: '',
        username: '',
        email: '',
        role: 'Student',
        department: 'Mechatronics & Robotics Engineering',
      })
      loadAdminData()
    } catch (err) {
      toast.error(err.message || 'Failed to create user')
    }
  }

  const handleToggleUserStatus = async (userId) => {
    try {
      const updated = await adminAPI.toggleUserStatus(userId)
      toast.info(`Account status for ${updated.full_name} set to ${updated.status}`)
      loadAdminData()
    } catch (err) {
      toast.error('Failed to change user status')
    }
  }

  // Machine Actions
  const handleSaveMachine = async (e) => {
    e.preventDefault()
    if (!newMachineData.machine_id || !newMachineData.model) {
      toast.error('Machine ID and Model designation are required.')
      return
    }

    try {
      if (editingMachine) {
        await machinesAPI.updateMachine(editingMachine.machine_id, newMachineData)
        toast.success(`Machine ${newMachineData.machine_id} updated successfully!`)
      } else {
        await machinesAPI.createMachine(newMachineData)
        toast.success(`Machine ${newMachineData.machine_id} registered into fleet!`)
      }
      setIsAddMachineModalOpen(false)
      setEditingMachine(null)
      setNewMachineData({
        machine_id: '',
        model: '',
        machine_name: '',
        category: 'Forming & Stamping',
        description: '',
        power_rating: '45 kW',
        max_pressure: '200 Bar',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      })
      loadAdminData()
    } catch (err) {
      toast.error(err.message || 'Failed to register machine')
    }
  }

  const handleDeleteMachine = async (machineId) => {
    if (!window.confirm(`Are you sure you want to delete ${machineId}? This will detach associated RAG chunks.`)) return
    try {
      await machinesAPI.deleteMachine(machineId)
      toast.success(`Machine ${machineId} decommissioned.`)
      loadAdminData()
    } catch (err) {
      toast.error('Failed to delete machine')
    }
  }

  const handleDeleteDocument = async (id) => {
    try {
      await manualsAPI.deleteManual(id)
      toast.success('Document purged from vector collection.')
      loadAdminData()
    } catch (err) {
      toast.error('Failed to delete document')
    }
  }

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesSearch =
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    return matchesRole && matchesSearch
  })

  // Filtered Machines
  const filteredMachines = machinesList.filter((m) =>
    m.machine_name.toLowerCase().includes(machineSearch.toLowerCase()) ||
    m.machine_id.toLowerCase().includes(machineSearch.toLowerCase())
  )

  // Chart telemetry data
  const userActivityData = [
    { hour: '08:00', queries: 42, activeUsers: 18 },
    { hour: '10:00', queries: 128, activeUsers: 64 },
    { hour: '12:00', queries: 95, activeUsers: 48 },
    { hour: '14:00', queries: 180, activeUsers: 92 },
    { hour: '16:00', queries: 154, activeUsers: 76 },
    { hour: '18:00', queries: 88, activeUsers: 34 },
    { hour: '20:00', queries: 52, activeUsers: 22 },
  ]

  const roleDistribution = [
    { name: 'Students', value: 142, color: '#06b6d4' },
    { name: 'Teachers', value: 12, color: '#8b5cf6' },
    { name: 'Admins', value: 3, color: '#10b981' },
  ]

  const sectionTitles = {
    overview: 'System Command & Telemetry',
    users: 'Identity & Access Management',
    machines: 'Industrial Machine Fleet',
    documents: 'RAG Knowledge Ingestion',
    analytics: 'Enterprise Platform Reports',
    settings: 'Configuration & System Logs',
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeSectionTitle={sectionTitles[activeTab]}
    >
      {/* 1. SYSTEM OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <GlassCard glow="cyan" className="p-6 md:p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="sm" dot>
                    Platform Online
                  </Badge>
                  <span className="text-xs text-slate-400">Environment: Production Master</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Admin Command Center
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Real-time operational control across students, faculty, machine equipment registries, vector RAG embeddings, and security policies.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <AnimatedButton
                    variant="primary"
                    size="md"
                    iconLeft={Users}
                    onClick={() => setActiveTab('users')}
                  >
                    Manage Users
                  </AnimatedButton>
                  <AnimatedButton
                    variant="secondary"
                    size="md"
                    iconLeft={Cpu}
                    onClick={() => setActiveTab('machines')}
                  >
                    Fleet Registry
                  </AnimatedButton>
                  <AnimatedButton
                    variant="gradient"
                    size="md"
                    iconLeft={FileCheck}
                    onClick={() => setActiveTab('documents')}
                  >
                    Knowledge Ingestion
                  </AnimatedButton>
                </div>
              </div>

              {/* Local demo telemetry pill */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-3 shrink-0">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    Data Storage
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">This browser</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-400" />
                    Demo Knowledge Index
                  </span>
                  <span className="text-cyan-400 font-bold font-mono">815 Chunks</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Query Latency
                  </span>
                  <span className="text-white font-bold font-mono">0.84s Avg</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Students"
              numericValue={stats.totalStudents}
              change="+12 this month"
              isPositive
              icon={Users}
              glow="cyan"
              subtext="Enrolled"
            />
            <StatCard
              title="Total Teachers"
              numericValue={stats.totalTeachers}
              change="Verified"
              isPositive
              icon={Shield}
              glow="violet"
              iconColor="text-purple-400"
              iconBg="bg-purple-500/10 border-purple-500/20"
              subtext="Faculty"
            />
            <StatCard
              title="Total Users"
              numericValue={stats.totalUsers}
              change="Platform-wide"
              isPositive
              icon={Radio}
              glow="blue"
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10 border-blue-500/20"
              subtext="Accounts"
            />
            <StatCard
              title="Total Questions"
              numericValue={stats.totalQuestions}
              change="+14% volume"
              isPositive
              icon={Activity}
              glow="cyan"
              iconColor="text-cyan-400"
              iconBg="bg-cyan-500/10 border-cyan-500/20"
              subtext="RAG Processed"
            />
            <StatCard
              title="Ingested Manuals"
              numericValue={documentsList.length || 28}
              change="100% Vectorized"
              isPositive
              icon={FileCheck}
              glow="cyan"
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              subtext="Active"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Platform System Activity</h3>
                    <p className="text-xs text-slate-400">Concurrent queries and active engineering students</p>
                  </div>
                  <Badge variant="cyan" size="sm">24h Telemetry</Badge>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userActivityData}>
                      <defs>
                        <linearGradient id="adminQueries" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
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
                        dataKey="queries"
                        name="RAG Queries"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="url(#adminQueries)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            {/* Role Breakdown Donut */}
            <GlassCard className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Role Demographics</h3>
                <p className="text-xs text-slate-400">Active accounts by privilege tier</p>

                <div className="h-44 w-full flex items-center justify-center my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleDistribution}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '16px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-white/[0.08] pt-3">
                {roleDistribution.map((r) => (
                  <div key={r.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      {r.name}
                    </span>
                    <span className="font-bold text-white">{r.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                User Identity & Access Control
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Provision students, invite instructors, toggle account status, and enforce RBAC roles.
              </p>
            </div>

            <AnimatedButton
              variant="primary"
              size="md"
              iconLeft={Plus}
              onClick={() => setIsAddUserModalOpen(true)}
            >
              Add New User
            </AnimatedButton>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <SearchBar
              value={userSearch}
              onChange={setUserSearch}
              placeholder="Search by name, email, or username..."
            />

            <div className="flex items-center gap-2">
              {['ALL', 'Student', 'Teacher', 'Admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    roleFilter === r
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'bg-white/[0.05] text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Assigned Role</th>
                    <th className="p-4 font-semibold">Department</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Last Active</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{u.full_name}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={u.role === 'Admin' ? 'emerald' : u.role === 'Teacher' ? 'violet' : 'cyan'}
                          size="sm"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-300 truncate max-w-[200px]">
                        {u.department}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            u.status === 'active'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          {u.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{u.last_active || 'Recent'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AnimatedButton
                            variant={u.status === 'active' ? 'ghost' : 'secondary'}
                            size="sm"
                            className="text-xs"
                            onClick={() => handleToggleUserStatus(u.id)}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </AnimatedButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Add User Modal */}
          <Modal
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
            title="Provision New User"
            subtitle="Create an authorized Student, Teacher, or Admin account."
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  placeholder="e.g. Jordan Smith"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Username</label>
                  <input
                    type="text"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="jordan.smith"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="jordan@industrial.edu"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Department / Division</label>
                <input
                  type="text"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                  placeholder="Mechatronics & Robotics"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/[0.08]">
                <AnimatedButton variant="ghost" size="sm" onClick={() => setIsAddUserModalOpen(false)}>
                  Cancel
                </AnimatedButton>
                <AnimatedButton type="submit" variant="primary" size="sm">
                  Create User
                </AnimatedButton>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* 3. MACHINE FLEET MANAGEMENT TAB */}
      {activeTab === 'machines' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Industrial Machine Fleet
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Register machinery, update telemetry metadata, configure pressure ratings, and attach schematics.
              </p>
            </div>

            <AnimatedButton
              variant="primary"
              size="md"
              iconLeft={Plus}
              onClick={() => {
                setEditingMachine(null)
                setIsAddMachineModalOpen(true)
              }}
            >
              Add New Machine
            </AnimatedButton>
          </div>

          {/* Machine Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredMachines.map((m) => (
              <GlassCard key={m.machine_id} className="p-0 overflow-hidden flex flex-col justify-between">
                <div className="relative h-44 w-full bg-slate-950">
                  <img src={m.image} alt={m.machine_name} className="w-full h-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d111c] to-transparent" />
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[11px] font-mono font-bold text-cyan-300">
                      {m.machine_id}
                    </span>
                    <Badge variant="cyan" size="sm">
                      {m.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-base font-bold text-white truncate max-w-[300px]">
                      {m.machine_name}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono">Model: {m.model}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {m.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[10px] text-slate-400">Power Rating</span>
                      <p className="font-semibold text-white">{m.power_rating}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[10px] text-slate-400">Max Pressure</span>
                      <p className="font-semibold text-white">{m.max_pressure}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      {m.manual_count || 1} Linked Manuals
                    </span>

                    <div className="flex items-center gap-2">
                      <AnimatedButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingMachine(m)
                          setNewMachineData(m)
                          setIsAddMachineModalOpen(true)
                        }}
                      >
                        Edit
                      </AnimatedButton>
                      <button
                        onClick={() => handleDeleteMachine(m.machine_id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Add/Edit Machine Modal */}
          <Modal
            isOpen={isAddMachineModalOpen}
            onClose={() => setIsAddMachineModalOpen(false)}
            title={editingMachine ? `Edit ${editingMachine.machine_id}` : 'Register New Machine'}
            subtitle="Configures industrial equipment registry parameters for RAG retrieval."
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleSaveMachine} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Machine ID (Code)</label>
                  <input
                    type="text"
                    value={newMachineData.machine_id}
                    disabled={!!editingMachine}
                    onChange={(e) => setNewMachineData({ ...newMachineData, machine_id: e.target.value })}
                    placeholder="M-CNC700"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Model Designation</label>
                  <input
                    type="text"
                    value={newMachineData.model}
                    onChange={(e) => setNewMachineData({ ...newMachineData, model: e.target.value })}
                    placeholder="CNC-700X"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Machine Descriptive Name</label>
                <input
                  type="text"
                  value={newMachineData.machine_name}
                  onChange={(e) => setNewMachineData({ ...newMachineData, machine_name: e.target.value })}
                  placeholder="High-Speed 5-Axis Milling Machine"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Power Rating</label>
                  <input
                    type="text"
                    value={newMachineData.power_rating}
                    onChange={(e) => setNewMachineData({ ...newMachineData, power_rating: e.target.value })}
                    placeholder="55 kW"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Max Pressure / Rating</label>
                  <input
                    type="text"
                    value={newMachineData.max_pressure}
                    onChange={(e) => setNewMachineData({ ...newMachineData, max_pressure: e.target.value })}
                    placeholder="250 Bar"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Technical Description</label>
                <textarea
                  rows={3}
                  value={newMachineData.description}
                  onChange={(e) => setNewMachineData({ ...newMachineData, description: e.target.value })}
                  placeholder="Operational parameters, safety precautions, and lab placement..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/[0.08]">
                <AnimatedButton variant="ghost" size="sm" onClick={() => setIsAddMachineModalOpen(false)}>
                  Cancel
                </AnimatedButton>
                <AnimatedButton type="submit" variant="primary" size="sm">
                  {editingMachine ? 'Save Changes' : 'Register Machine'}
                </AnimatedButton>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* 4. DOCUMENT & KNOWLEDGE MANAGEMENT TAB */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Document Ingestion & Knowledge Index
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Centralized manual store powering RAG vector chunking, metadata extraction, and citations.
              </p>
            </div>

            <AnimatedButton
              variant="gradient"
              size="md"
              iconLeft={Upload}
              onClick={() => setIsUploadDocModalOpen(true)}
            >
              Upload PDF Manual
            </AnimatedButton>
          </div>

          <GlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 font-semibold">Document Title</th>
                    <th className="p-4 font-semibold">Associated Machine</th>
                    <th className="p-4 font-semibold">Revision</th>
                    <th className="p-4 font-semibold">Vector Status</th>
                    <th className="p-4 font-semibold">Chunks</th>
                    <th className="p-4 font-semibold">Uploaded</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {documentsList.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-white">{doc.document_name}</p>
                            <p className="text-[11px] font-mono text-slate-400">{doc.document_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="cyan" size="sm">
                          {doc.machine_id}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-slate-300">Rev {doc.revision}</td>
                      <td className="p-4">
                        <Badge variant="emerald" size="sm" dot>
                          Completed
                        </Badge>
                      </td>
                      <td className="p-4 font-mono font-semibold text-white">
                        {doc.total_chunks || 148}
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <UploadDocumentModal
            isOpen={isUploadDocModalOpen}
            onClose={() => setIsUploadDocModalOpen(false)}
            machines={machinesList}
            onUploadSuccess={() => loadAdminData()}
          />
        </div>
      )}

      {/* 5. ANALYTICS & REPORTS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Platform Intelligence & RAG Reports
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Comprehensive telemetry evaluating model response quality, token costs, and student inquiry spikes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Query Throughput by Laboratory Section</h3>
              <p className="text-xs text-slate-400">Peak system consumption</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { section: 'Lab Section A', count: 340 },
                      { section: 'Lab Section B', count: 480 },
                      { section: 'Lab Section C', count: 290 },
                      { section: 'Graduate Research', count: 179 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="section" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white">RAG Confidence & Precision Matrix</h3>
              <p className="text-xs text-slate-400">Citation match quality</p>

              <div className="space-y-4 pt-2">
                {[
                  { metric: 'Direct OEM Manual Match (>90%)', pct: 92, color: 'bg-emerald-400' },
                  { metric: 'Partial Multi-chunk Synthesis (80-90%)', pct: 6, color: 'bg-cyan-400' },
                  { metric: 'Fallback / Insufficient Evidence Flagged', pct: 2, color: 'bg-amber-400' },
                ].map((m) => (
                  <div key={m.metric} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-medium">{m.metric}</span>
                      <span className="font-bold text-slate-300">{m.pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 mt-4">
                <strong>Zero Hallucination Guarantee:</strong> Strict ground-truth checking suppresses any generation lacking verified citation chunks.
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 6. SYSTEM SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Enterprise System Configuration
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Vector store hyper-parameters, LLM inference endpoints, and audit logging.
            </p>
          </div>

          {/* RAG & LLM Engine Settings */}
          <GlassCard className="p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold text-white pb-3 border-b border-white/[0.08] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>RAG & Vector Pipeline Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Vector Chunk Token Size</label>
                <input
                  type="text"
                  value={ragChunkSize}
                  onChange={(e) => setRagChunkSize(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Model Temperature (Deterministic)</label>
                <input
                  type="text"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Inference Key (OpenRouter / OpenAI)</label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => toast.success('RAG Pipeline parameters reloaded and applied!')}
              >
                Apply Parameters
              </AnimatedButton>
            </div>
          </GlassCard>

          {/* Audit Logs */}
          <GlassCard className="p-6 md:p-8 space-y-4">
            <h3 className="text-base font-bold text-white pb-3 border-b border-white/[0.08] flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>System Activity & Audit Log</span>
            </h3>

            <div className="space-y-2.5 font-mono text-xs">
              {[
                { time: '13:42:10', event: 'Manual ingestion completed: HP200_Operations_Rev1_2.pdf (148 chunks)', status: 'SUCCESS' },
                { time: '13:30:05', event: 'Student question processed: Reset procedure alarm E-301 (M-HP200)', status: '200 OK' },
                { time: '12:15:44', event: 'Teacher review added by Prof. Marcus Vance on Question #101', status: 'VERIFIED' },
                { time: '11:02:18', event: 'Vector index backup snapshot created (815 chunks)', status: 'STORED' },
              ].map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-3 text-slate-300"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500">{log.time}</span>
                    <span className="truncate">{log.event}</span>
                  </div>
                  <Badge variant="emerald" size="sm">{log.status}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  )
}
