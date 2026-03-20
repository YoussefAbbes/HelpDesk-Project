/**
 * TicketsPage — lists all tickets with filtering, search, and pagination.
 * Accessible by all roles (data is filtered server-side by role).
 */

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter, X } from 'lucide-react'
import useTicketStore from '../store/ticketStore'
import useAuthStore from '../store/authStore'
import TicketCard from '../components/TicketCard'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']
const PRIORITY_OPTIONS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const CATEGORY_OPTIONS = ['', 'BILLING', 'TECH_SUPPORT', 'BUG', 'FEATURE', 'GENERAL', 'OTHER']
const SENTIMENT_OPTIONS = ['', 'POSITIVE', 'NEUTRAL', 'NEGATIVE']

export default function TicketsPage() {
  const { tickets, pagination, filters, isLoading, fetchTickets, setFilters, clearFilters } =
    useTicketStore()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTickets(page)
  }, [filters, page])

  const handleSearch = (e) => {
    setFilters({ search: e.target.value })
    setPage(1)
  }

  const handleFilter = (key, value) => {
    setFilters({ [key]: value })
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user?.role === 'CUSTOMER' ? 'My Tickets' : 'All Tickets'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.count} total</p>
        </div>
        <Link to="/tickets/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {/* Search & Filter bar */}
      <div className="card mb-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search tickets…"
              value={filters.search}
              onChange={handleSearch}
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gray-100 dark:bg-dark-hover' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {Object.values(filters).some(Boolean) && (
            <button onClick={() => { clearFilters(); setPage(1) }} className="btn-secondary flex items-center gap-2 text-red-600">
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilter('status', e.target.value)}
                className="input text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s || 'All'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilter('priority', e.target.value)}
                className="input text-sm"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p || 'All'}</option>
                ))}
              </select>
            </div>
            {/* AI filters — only for agents/admins */}
            {user?.role !== 'CUSTOMER' && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">AI Category</label>
                  <select
                    value={filters.ai_category}
                    onChange={(e) => handleFilter('ai_category', e.target.value)}
                    className="input text-sm"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c || 'All'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Sentiment</label>
                  <select
                    value={filters.ai_sentiment}
                    onChange={(e) => handleFilter('ai_sentiment', e.target.value)}
                    className="input text-sm"
                  >
                    {SENTIMENT_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s || 'All'}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg">No tickets found.</p>
          <Link to="/tickets/new" className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-2 inline-block">
            Create your first ticket →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(pagination.next || pagination.previous) && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!pagination.previous}
            className="btn-secondary disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.next}
            className="btn-secondary disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
