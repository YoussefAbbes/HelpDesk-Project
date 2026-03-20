/**
 * Navbar — top navigation bar with role-aware links and dark mode support.
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, BarChart3, LogOut, Bell, Menu } from 'lucide-react'
import useAuthStore from '../store/authStore'
import ThemeToggle from './ui/ThemeToggle'
import MobileMenu from './MobileMenu'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border backdrop-blur-lg bg-white/90 dark:bg-dark-card/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Hamburger menu button (mobile only) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-lg group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 dark:text-gray-100">
              HelpDesk <span className="text-primary-600 dark:text-primary-400">AI</span>
            </span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/tickets"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
            >
              <Ticket className="w-4 h-4" />
              Tickets
            </Link>

            {/* Analytics — admin only */}
            {user?.role === 'ADMIN' && (
              <Link
                to="/analytics"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
            </button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User menu */}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold text-xs">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="leading-none">{user?.username}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                  {user?.role}
                </span>
              </div>
            </Link>

            {/* Logout - hidden on mobile */}
            <button
              onClick={handleLogout}
              className="hidden md:block p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover hover:text-error-600 dark:hover:text-error-400 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}
