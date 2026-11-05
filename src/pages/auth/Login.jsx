import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { useTheme } from '../../context/ThemeContext'
import { ThemeToggle } from '../../components/auth/ThemeToggle'
import { RoleSelector, ROLES } from '../../components/auth/RoleSelector'
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal'
import { EvalAILogo } from '../../components/auth/EvalAILogo'

const REMEMBERED_USER_KEY = 'evalai_remembered_username'

export function Login() {
  const navigate = useNavigate()
  const { login, demoLogin, isLoading } = useAuth()
  const { toast } = useNotification()
  const { isDark } = useTheme()

  // Form State
  const [selectedRole, setSelectedRole] = useState('Student')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Validation & Error Handling
  const [formErrors, setFormErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [showDemoDrawer, setShowDemoDrawer] = useState(false)

  // Pre-load remembered credentials on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem(REMEMBERED_USER_KEY)
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
  }, [])

  // Clear specific field errors on user keystroke
  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
    if (formErrors.username) {
      setFormErrors((prev) => ({ ...prev, username: '' }))
    }
    if (apiError) setApiError(null)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (formErrors.password) {
      setFormErrors((prev) => ({ ...prev, password: '' }))
    }
    if (apiError) setApiError(null)
  }

  // Role change handler
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId)
    if (apiError?.type === 'role_mismatch') {
      setApiError(null)
    }
  }

  // Validate form fields prior to submission
  const validateForm = () => {
    const errors = {}
    const trimmedUser = username.trim()

    if (!trimmedUser) {
      errors.username = 'Username or email address is required.'
    } else if (trimmedUser.length < 3) {
      errors.username = 'Username must be at least 3 characters.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Navigate user to their verified role dashboard
  const routeByRole = (userRole) => {
    const normalized = (userRole || '').toLowerCase()
    if (normalized === 'admin') {
      navigate('/admin')
    } else if (normalized === 'teacher') {
      navigate('/teacher')
    } else {
      navigate('/student')
    }
  }

  // Primary Login Submission
  const handleLogin = async (e) => {
    e?.preventDefault()
    setApiError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const authenticatedUser = await login(
        username.trim(),
        password,
        selectedRole,
        rememberMe
      )

      // 2. Strict Role Verification Check:
      // Prevent role selection from overriding the actual authenticated user's role
      if (
        authenticatedUser.role &&
        authenticatedUser.role.toLowerCase() !== selectedRole.toLowerCase()
      ) {
        setApiError({
          type: 'role_mismatch',
          message: `Access Denied: Your account role is verified as "${authenticatedUser.role}", but you attempted to sign in via the "${selectedRole}" workspace. Please switch to the ${authenticatedUser.role} tab.`,
        })
        setIsSubmitting(false)
        return
      }

      // 3. Persist Remember Me preference
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_USER_KEY, username.trim())
      } else {
        localStorage.removeItem(REMEMBERED_USER_KEY)
      }

      toast.success(`Welcome to EvalAI, ${authenticatedUser.full_name || authenticatedUser.username}!`)
      routeByRole(authenticatedUser.role)
    } catch (err) {
      setApiError({
        type: 'auth_failed',
        message: err.message || 'Authentication failed. Please verify your demo credentials.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Demo Access for Hackathon evaluation / offline presentation
  const handleLaunchDemo = async (roleName) => {
    setApiError(null)
    setIsSubmitting(true)
    try {
      setSelectedRole(roleName)
      const demoUser = await demoLogin(roleName, rememberMe)

      // Verify role alignment
      if (demoUser.role.toLowerCase() !== roleName.toLowerCase()) {
        setApiError({
          type: 'role_mismatch',
          message: `Role mismatch: Attempted ${roleName} login, but received ${demoUser.role}.`,
        })
        return
      }

      toast.success(`Signed in as Demo ${roleName}: ${demoUser.full_name}`)
      routeByRole(demoUser.role)
    } catch (err) {
      setApiError({
        type: 'auth_failed',
        message: err.message || 'Failed to start demo session.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-fill demo credentials into form fields
  const handleAutofillDemo = (roleName) => {
    setSelectedRole(roleName)
    setApiError(null)
    setFormErrors({})

    const presets = {
      Student: { u: 'alex.student', p: 'industrial2026' },
      Teacher: { u: 'marcus.vance', p: 'industrial2026' },
      Admin: { u: 'admin.arthur', p: 'industrial2026' },
    }

    const preset = presets[roleName] || presets.Student
    setUsername(preset.u)
    setPassword(preset.p)
    toast.info(`Pre-filled ${roleName} credentials into form. Click submit to test.`)
  }

  return (
    <div
      className={`min-h-screen relative flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-[#070b19] text-slate-100'
          : 'bg-[#f4f7fb] text-slate-900'
      }`}
    >
      {/* ==========================================
          APPLE-INSPIRED AMBIENT BACKGROUND GLOWS
         ========================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {isDark ? (
          <>
            {/* Dark Theme Ambient Orbs */}
            <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px]" />
            <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px]" />
            <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px]" />
            {/* Subtle high-tech grid */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          </>
        ) : (
          <>
            {/* Light Theme Ambient Glows */}
            <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-blue-400/20 rounded-full blur-[140px]" />
            <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[160px]" />
            <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[150px]" />
            {/* Subtle light grid */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          </>
        )}
      </div>

      {/* ==========================================
          TOP NAVIGATION BAR
         ========================================== */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <EvalAILogo size="sm" showSubtitle={false} />

        <div className="flex items-center gap-3">
          {/* Local Demo Mode Indicator */}
          <div
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-colors ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                : 'bg-white/80 border-slate-200 text-slate-600 shadow-xs'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono tracking-tight">
              Local Demo Mode
            </span>
          </div>

          {/* Theme Toggle (Top-Right Corner) */}
          <ThemeToggle />
        </div>
      </header>

      {/* ==========================================
          MAIN CENTERED LOGIN CARD
         ========================================== */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6 my-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="w-full"
        >
          <div
            className={`w-full rounded-3xl p-6 sm:p-8 border transition-all duration-300 ${
              isDark
                ? 'bg-[#0f172a]/80 backdrop-blur-2xl border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6),0_0_40px_rgba(37,99,235,0.12)]'
                : 'bg-white/95 backdrop-blur-2xl border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.1),0_0_1px_1px_rgba(15,23,42,0.05)]'
            }`}
          >
            {/* Top Branding Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="flex justify-center mb-1">
                <EvalAILogo size="md" showSubtitle={false} />
              </div>
              <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Explainable Automated Descriptive Answer Evaluation System
              </p>
            </div>

            {/* 3-Role Segmented Control */}
            <div className="mb-6">
              <RoleSelector
                selectedRole={selectedRole}
                onSelectRole={handleRoleSelect}
              />
            </div>

            {/* API / Role Mismatch Error Banner */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-5"
                >
                  <div
                    className={`p-3.5 rounded-2xl flex items-start gap-3 border text-xs leading-relaxed ${
                      apiError.type === 'role_mismatch'
                        ? isDark
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                        : isDark
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {apiError.type === 'role_mismatch' ? (
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">
                        {apiError.type === 'role_mismatch'
                          ? 'Portal Access Mismatch'
                          : 'Authentication Error'}
                      </p>
                      <p>{apiError.message}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {/* Username or Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="evalai-username"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Username or Academic Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="evalai-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="e.g. alex.student or alex@evalai.edu"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all border ${
                      formErrors.username
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
                {formErrors.username && (
                  <p className="text-[11px] text-rose-500 font-medium pl-1">
                    {formErrors.username}
                  </p>
                )}
              </div>

              {/* Password Input with Show / Hide Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="evalai-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="evalai-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm transition-all border ${
                      formErrors.password
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-[11px] text-rose-500 font-medium pl-1">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/30 cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Remember me on this device
                  </span>
                </label>
              </div>

              {/* Login Button with Dynamic Role Label */}
              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  whileHover={!isSubmitting ? { scale: 1.015, y: -1 } : undefined}
                  whileTap={!isSubmitting ? { scale: 0.985 } : undefined}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.45)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none border border-white/20"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue as {selectedRole}</span>
                      <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            {/* ==========================================
                SEPARATED DEMO SANDBOX (For Hackathon Review)
               ========================================== */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hackathon Demo Sandbox
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {showDemoDrawer ? 'Hide Details' : 'View Demo Accounts'}
                </button>
              </div>

              {/* 1-Click Launch Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon
                  return (
                    <button
                      key={`quick-${r.id}`}
                      type="button"
                      onClick={() => handleLaunchDemo(r.id)}
                      disabled={isSubmitting}
                      title={`Instant 1-click test as ${r.label}`}
                      className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                        selectedRole === r.id
                          ? isDark
                            ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm'
                            : 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                          : isDark
                          ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-semibold">{r.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Expandable Demo Details & Auto-Fill */}
              <AnimatePresence>
                {showDemoDrawer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-1 space-y-2 text-xs"
                  >
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Click any role below to pre-fill the form and test standard credential validation:
                    </p>
                    <div className="space-y-1.5">
                      <div
                        onClick={() => handleAutofillDemo('Student')}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${
                          isDark
                            ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-white'
                        }`}
                      >
                        <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          alex.student
                        </span>
                        <span className="text-[10px] text-slate-500">Student Role</span>
                      </div>
                      <div
                        onClick={() => handleAutofillDemo('Teacher')}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${
                          isDark
                            ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-white'
                        }`}
                      >
                        <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                          marcus.vance
                        </span>
                        <span className="text-[10px] text-slate-500">Teacher Role</span>
                      </div>
                      <div
                        onClick={() => handleAutofillDemo('Admin')}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${
                          isDark
                            ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-white'
                        }`}
                      >
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                          admin.arthur
                        </span>
                        <span className="text-[10px] text-slate-500">Admin Role</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ==========================================
          PROFESSIONAL FOOTER
         ========================================== */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-4 py-4 text-center space-y-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          EvalAI &bull; Explainable Automated Descriptive Answer Evaluation System
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          &copy; {new Date().getFullYear()} EvalAI Academic Systems &bull; Runs with local demo data
        </p>
      </footer>

      {/* ==========================================
          FORGOT PASSWORD MODAL
         ========================================== */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  )
}
export default Login
