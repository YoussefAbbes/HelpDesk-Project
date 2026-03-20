/**
 * Navbar — top navigation bar with role-aware links.
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, BarChart3, LogOut, User } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-primary-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <LayoutDashboard className="w-6 h-6 text-primary-100" />
            <span>HelpDesk <span className="text-primary-300">AI</span></span>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-6">
            <Link
              to="/tickets"
              className="flex items-center gap-1.5 text-sm text-primary-100 hover:text-white transition-colors"
            >
              <Ticket className="w-4 h-4" />
              Tickets
            </Link>

            {/* Analytics — admin only */}
            {user?.role === 'ADMIN' && (
              <Link
                to="/analytics"
                className="flex items-center gap-1.5 text-sm text-primary-100 hover:text-white transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-sm text-primary-100 hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
              {user?.username}
              <span className="text-xs bg-primary-700 px-1.5 py-0.5 rounded">
                {user?.role}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-primary-200 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
