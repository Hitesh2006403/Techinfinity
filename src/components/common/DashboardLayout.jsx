import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function DashboardLayout({
  activeTab,
  onTabChange,
  activeSectionTitle,
  children,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleNavEvent = (e) => {
      if (e.detail && onTabChange) {
        onTabChange(e.detail)
      }
    }
    window.addEventListener('nav-tab-select', handleNavEvent)
    return () => window.removeEventListener('nav-tab-select', handleNavEvent)
  }, [onTabChange])

  return (
    <div className="min-h-screen bg-[#07090e] bg-mesh-gradient flex text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar
          onMobileMenuToggle={() => setIsMobileOpen(true)}
          activeSectionTitle={activeSectionTitle}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
