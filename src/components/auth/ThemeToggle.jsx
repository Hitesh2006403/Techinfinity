import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 backdrop-blur-xl border ${
        isDark
          ? 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-600 shadow-lg shadow-black/20'
          : 'bg-white/80 border-slate-200/90 text-slate-700 hover:text-slate-950 hover:bg-white shadow-md shadow-slate-200/50'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ y: -12, opacity: 0, rotate: -45 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 12, opacity: 0, rotate: 45 }}
              transition={{ duration: 0.2 }}
              className="text-blue-400"
            >
              <Moon className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ y: 12, opacity: 0, rotate: 45 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -12, opacity: 0, rotate: -45 }}
              transition={{ duration: 0.2 }}
              className="text-amber-500"
            >
              <Sun className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="text-[11px] font-medium tracking-wide">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </motion.button>
  )
}
