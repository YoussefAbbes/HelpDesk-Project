/**
 * DashboardPage — role-aware landing page after login.
 *
 * - Customers: quick stats + recent tickets
 * - Agents: unassigned queue + priority tickets
 * - Admins: redirected to full analytics
 */

import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, BarChart3, Ticket } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useTicketStore from '../store/ticketStore'
import TicketCard from '../components/TicketCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { tickets, isLoading, fetchTickets, setFilters } = useTicketStore()

  useEffect(() => {
    // Admin goes straight to analytics
    if (user?.role === 'ADMIN') {
      navigate('/analytics')
      return
    }
    // Agents see open/in-progress tickets
    if (user?.role === 'AGENT') {
      setFilters({ status: 'OPEN', ordering: '-priority' })
    }
    fetchTickets()
  }, [user])

  if (isLoading) return <LoadingSpinner className="py-32" />

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome banner */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white mb-6">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.first_name || user?.username}!
        </h1>
        <p className="mt-1 text-primary-100">
          {user?.role === 'CUSTOMER'
            ? 'Track your support tickets below.'
            : 'Here are the open tickets awaiting your attention.'}
        </p>
        <div className="flex gap-3 mt-4">
          <Link to="/tickets/new" className="bg-white text-primary-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-primary-50 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Ticket
          </Link>
          <Link to="/tickets" className="bg-primary-800 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            All Tickets
          </Link>
          {user?.role === 'ADMIN' && (
            <Link to="/analytics" className="bg-primary-800 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          )}
        </div>
      </div>

      {/* Recent / open tickets */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {user?.role === 'AGENT' ? 'Open Tickets' : 'Recent Tickets'}
      </h2>

      {tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No tickets yet.</p>
          <Link to="/tickets/new" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Submit your first ticket →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.slice(0, 10).map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
          {tickets.length > 10 && (
            <Link to="/tickets" className="block text-center text-primary-600 hover:underline text-sm mt-2">
              View all {tickets.length} tickets →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
