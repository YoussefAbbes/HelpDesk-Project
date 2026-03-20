/**
 * MobileMenu - Slide-in navigation drawer for mobile devices
 *
 * Features:
 * - Slide-in animation from left
 * - Backdrop overlay
 * - User profile section
 * - Navigation links
 * - Theme toggle
 * - Logout button
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, LayoutDashboard, Ticket, BarChart3, User, Settings, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { ThemeSelector } from './ui/ThemeToggle'

export default function MobileMenu({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }

  const handleLinkClick = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-dark-card shadow-2xl z-50 md:hidden animate-slide-in-left">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                HelpDesk <span className="text-primary-600 dark:text-primary-400">AI</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <Link
              to="/profile"
              onClick={handleLinkClick}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-hover rounded-xl transition-colors"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold text-lg">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {user?.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>

              <Link
                to="/tickets"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                <Ticket className="w-5 h-5" />
                Tickets
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/analytics"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
                >
                  <BarChart3 className="w-5 h-5" />
                  Analytics
                </Link>
              )}

              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                <User className="w-5 h-5" />
                Profile
              </Link>

              <Link
                to="/settings"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border space-y-3">
            {/* Theme Selector */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-3">
                Theme
              </p>
              <ThemeSelector className="w-full" />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
