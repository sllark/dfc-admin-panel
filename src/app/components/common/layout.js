'use client'
import React, { useEffect, useState } from 'react'
import Topbar from './topbar'
import Sidebar from './sidebar'

const SIDEBAR_STORAGE_KEY = 'dfc.sidebar.open'

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (saved == null) return true
    return saved === '1'
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, isOpen ? '1' : '0')
    } catch {
      // ignore storage failures
    }
  }, [isOpen])

  const toggleSidebar = () => setIsOpen((v) => !v)

  // Below md: expanded sidebar overlays (ml-0). md+: push content (md:ml-64).
  const mainMarginClass = isOpen ? 'ml-0 md:ml-64' : 'ml-16'

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-gray-950 text-white">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${mainMarginClass}`}
      >
        <Topbar />
        <main className="p-4 sm:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}

export default Layout