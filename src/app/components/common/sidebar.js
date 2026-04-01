'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import {
  FiMenu,
  FiHome,
  FiBriefcase,
  FiUserCheck,
  FiCreditCard,
  FiUsers,
  FiUser,
  FiGrid,
} from 'react-icons/fi'
import Link from 'next/link'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname()
  // Flat list so icons-only (collapsed) navigation always works.
  const sidebarMenu = [
    { label: 'Home', icon: FiHome, href: '/dashboard' },
    { label: 'Services', icon: FiBriefcase, href: '/dashboard/admin/services' },
    { label: 'Pricing Structure', icon: FiGrid, href: '/dashboard/admin/pricing_structure' },
    {
      label: 'Registered Donors',
      icon: FiUserCheck,
      href: '/dashboard/admin/donor_registration',
    },
    { label: 'Payments', icon: FiCreditCard, href: '/dashboard/admin/payments' },
    { label: 'Users', icon: FiUsers, href: '/dashboard/admin/users' },
    { label: 'Profile', icon: FiUser, href: '/dashboard/settings' },
  ]

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <aside
        className={`bg-gray-900 text-white h-[100dvh] fixed left-0 top-0 transition-all duration-300 flex flex-col z-40 ${
          isOpen ? 'w-64 shadow-2xl md:shadow-none' : 'w-16'
        }`}
      >
      {/* Top Section */}
      <div className="flex items-center min-h-16 px-4 py-3 bg-gray-900 flex-shrink-0">
        {!isOpen ? (
          <button
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="shrink-0"
          >
            <FiMenu className="text-white text-2xl leading-none" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="flex-1 min-w-0"
          >
            <img
              src="/logo-with-name-white.png"
              alt="Drug-Free Compliance"
              className="h-12 w-full object-contain object-left"
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-2 overflow-y-auto">
        {sidebarMenu.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 justify-start p-2 w-full rounded transition-colors duration-200 ${
                active
                  ? 'bg-gray-800 text-cyan-400'
                  : 'hover:bg-gray-800 hover:text-cyan-300'
              }`}
            >
              <item.icon className="text-lg shrink-0" />
              {isOpen && (
                <span className="min-w-0 truncate text-sm sm:text-base">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
    </>
  )
}

export default Sidebar
