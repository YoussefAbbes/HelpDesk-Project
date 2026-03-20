/**
 * NewTicketPage — form for creating a new support ticket.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useTicketStore from '../store/ticketStore'
import LoadingSpinner from '../components/LoadingSpinner'

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function NewTicketPage() {
  const navigate = useNavigate()
  const { createTicket, isLoading } = useTicketStore()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (!form.description.trim()) errs.description = 'Description is required.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    const ticket = await createTicket(form)
    if (ticket) navigate(`/tickets/${ticket.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Submit a New Ticket</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Our AI will automatically categorize and analyze your ticket.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({}) }}
              className={`input ${errors.title ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="e.g. Cannot log in to my account"
              maxLength={255}
            />
            {errors.title && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({}) }}
              rows={6}
              className={`input resize-none ${errors.description ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Please describe your issue in detail…"
            />
            {errors.description && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="input"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
              {isLoading ? <LoadingSpinner size="sm" /> : null}
              Submit Ticket
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* AI info banner */}
      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl text-sm text-purple-800 dark:text-purple-300">
        <strong>AI-powered analysis:</strong> Once submitted, our AI will automatically
        detect the category, sentiment, and draft a suggested reply for the support team —
        all processed in the background without delays.
      </div>
    </div>
  )
}
