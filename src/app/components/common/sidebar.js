'use client'
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  FaBars,
  FaHome,
  FaCog,
  FaChevronDown,
  FaChevronRight,
  FaUserFriends,
} from 'react-icons/fa'
import Link from 'next/link'

// Sidebar menu structure
const sidebarMenu = [
  {
    label: 'Home',
    icon: FaHome,
    href: '/dashboard',
  },
  {
    label: 'Admin',
    icon: FaUserFriends,
    href: '#',
    children: [
      { label: 'Services', href: '/dashboard/admin/services' },
      { label: 'Registered Doner', href: '/dashboard/admin/donor_registration' },
      { label: 'Payments', href: '/dashboard/admin/payments' },
      { label: 'Users', href: '/dashboard/admin/users' },
    ],
  },
  {
    label: 'Settings',
    icon: FaCog,
    href: '#',
    children: [
      { label: 'Profile', href: '/dashboard/settings' },
    ],
  },
]

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (label) => {
    setExpanded((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  return (
    <aside
      className={`bg-gray-900 text-white h-screen transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      } flex flex-col`}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between p-4">
        <button onClick={toggleSidebar}>
          <FaBars className="text-white text-xl" />
        </button>
        {isOpen && <h2 className="text-lg font-bold">Drug-Free Compliance</h2>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-2 overflow-y-auto">
        {sidebarMenu.map((item, idx) => {
          const isActive = pathname.startsWith(item.href)
          const isExpanded = expanded[item.label] || isActive
          const hasChildren = !!item.children

          return (
            <div key={idx}>
              {/* Item with children: use button */}
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`flex items-center justify-between p-2 w-full rounded transition-colors duration-200 ${
                    isActive
                      ? 'bg-gray-800 text-cyan-400'
                      : 'hover:bg-gray-800 hover:text-cyan-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="text-lg" />
                    {isOpen && <span>{item.label}</span>}
                  </div>

                  {isOpen && (
                    <span className="transition-transform duration-300">
                      {isExpanded ? (
                        <FaChevronDown className="text-sm" />
                      ) : (
                        <FaChevronRight className="text-sm" />
                      )}
                    </span>
                  )}
                </button>
              ) : (
                // Item without children: use Link
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 p-2 w-full rounded transition-colors duration-200 ${
                    isActive
                      ? 'bg-gray-800 text-cyan-400'
                      : 'hover:bg-gray-800 hover:text-cyan-300'
                  }`}
                >
                  <item.icon className="text-lg" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              )}

              {/* Submenu */}
              {isOpen && hasChildren && isExpanded && (
                <div className="ml-6 mt-1 space-y-1 transition-all duration-300">
                  {item.children.map((child, cIdx) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={cIdx}
                        href={child.href}
                        className={`block text-sm px-2 py-1 rounded transition-colors duration-200 ${
                          isChildActive
                            ? 'text-cyan-300 bg-gray-800'
                            : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
