'use client'
import React, { useState } from 'react'
import Topbar from './topbar'
import Sidebar from './sidebar'


const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true)
  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

export default Layout