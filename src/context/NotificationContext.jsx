import React, { createContext, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const NotificationContext = createContext(null)

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'New Manual Ingested',
    message: 'HP200_Operations_Rev1_2.pdf has completed RAG vector indexing with 148 chunks.',
    time: '10 mins ago',
    type: 'success',
    read: false,
  },
  {
    id: 'n2',
    title: 'Teacher Review Added',
    message: 'Prof. Marcus Vance reviewed your question on hydraulic valve alarm E-301.',
    time: '1 hour ago',
    type: 'info',
    read: false,
  },
  {
    id: 'n3',
    title: 'System Optimization Notice',
    message: 'Vector database index re-clustered. RAG retrieval latency improved to 0.84s.',
    time: '3 hours ago',
    type: 'info',
    read: true,
  },
]

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString()
    const newToast = { id, message, type }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }
  }

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const toast = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
  }

  return (
    <NotificationContext.Provider
      value={{
        toast,
        notifications,
        unreadCount,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}

      {/* Floating Glass Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md pointer-events-none">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl glass-dropdown border border-white/10 shadow-2xl backdrop-blur-2xl text-slate-100 min-w-[320px]"
            >
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {item.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
              </div>
              <div className="flex-1 text-sm leading-relaxed text-slate-200">
                {item.message}
              </div>
              <button
                onClick={() => dismissToast(item.id)}
                className="shrink-0 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
