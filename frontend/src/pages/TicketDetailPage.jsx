/**
 * TicketDetailPage — full ticket view with messages, AI insights, and actions.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { Send, Trash2, RefreshCw, Bot, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

import useTicketStore from '../store/ticketStore'
import useAuthStore from '../store/authStore'
import SentimentBadge from '../components/SentimentBadge'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ticketService from '../services/ticketService'

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentTicket, fetchTicket, updateTicket, deleteTicket, isLoading } = useTicketStore()
  const { user } = useAuthStore()

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isReprocessing, setIsReprocessing] = useState(false)

  const isAgentOrAdmin = user?.role !== 'CUSTOMER'

  useEffect(() => {
    loadTicket()
  }, [id])

  const loadTicket = async () => {
    const ticket = await fetchTicket(id)
    if (ticket) setMessages(ticket.messages || [])
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setIsSending(true)
    try {
      const msg = await ticketService.addMessage(id, {
        body: newMessage.trim(),
        is_internal: isInternal,
      })
      setMessages((prev) => [...prev, msg])
      setNewMessage('')
      setIsInternal(false)
    } catch {
      toast.error('Failed to send message.')
    } finally {
      setIsSending(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    await updateTicket(id, { status: newStatus })
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return
    await deleteTicket(id)
    navigate('/tickets')
  }

  const handleReprocessAI = async () => {
    setIsReprocessing(true)
    try {
      await ticketService.reprocessAI(id)
      toast.success('AI re-analysis queued. Refresh in a moment to see updated results.')
    } catch {
      toast.error('Failed to queue AI re-analysis.')
    } finally {
      setIsReprocessing(false)
    }
  }

  if (isLoading || !currentTicket) {
    return <LoadingSpinner className="py-32" />
  }

  const ticket = currentTicket

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Ticket header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              #{ticket.id} · Submitted by{' '}
              <strong>{ticket.created_by?.username}</strong> ·{' '}
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {ticket.ai_processed && (
                <SentimentBadge
                  sentiment={ticket.ai_sentiment}
                  score={ticket.ai_sentiment_score}
                />
              )}
              {ticket.ai_category && (
                <span className="badge bg-indigo-50 text-indigo-700">
                  {ticket.ai_category.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {isAgentOrAdmin && (
            <div className="flex gap-2 shrink-0">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="input text-sm py-1 px-2"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <button
                onClick={handleReprocessAI}
                disabled={isReprocessing}
                className="btn-secondary flex items-center gap-1 text-sm py-1 px-2"
                title="Re-run AI analysis"
              >
                <RefreshCw className={`w-4 h-4 ${isReprocessing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleDelete}
                className="btn-secondary text-red-600 hover:bg-red-50 py-1 px-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
          {ticket.description}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages thread */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-800">Messages ({messages.length})</h2>

          {messages.length === 0 && (
            <p className="text-gray-400 text-sm">No messages yet.</p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-4 ${
                msg.is_internal
                  ? 'bg-yellow-50 border border-yellow-200'
                  : msg.author.id === user?.id
                  ? 'bg-primary-50 border border-primary-100'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{msg.author.username}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {msg.author.role}
                  </span>
                  {msg.is_internal && (
                    <span className="flex items-center gap-1 text-xs text-yellow-700 font-medium">
                      <Lock className="w-3 h-3" /> Internal
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.body}</p>
            </div>
          ))}

          {/* Message composer */}
          <form onSubmit={handleSendMessage} className="card mt-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a reply…"
              rows={3}
              className="input resize-none mb-3"
            />
            <div className="flex items-center justify-between">
              {isAgentOrAdmin && (
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <Lock className="w-3.5 h-3.5" />
                  Internal note
                </label>
              )}
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="btn-primary flex items-center gap-2 ml-auto"
              >
                {isSending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </form>
        </div>

        {/* AI Insights sidebar */}
        <div className="space-y-4">
          {/* AI Suggested Reply */}
          {isAgentOrAdmin && ticket.ai_suggested_reply && (
            <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 text-sm">AI Suggested Reply</h3>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.ai_suggested_reply}
              </p>
              <button
                onClick={() => setNewMessage(ticket.ai_suggested_reply)}
                className="mt-3 text-xs text-purple-600 hover:underline font-medium"
              >
                Use this reply →
              </button>
            </div>
          )}

          {/* Ticket metadata */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Ticket Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Assigned to</dt>
                <dd className="font-medium">{ticket.assigned_to?.username || 'Unassigned'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</dd>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Resolved</dt>
                  <dd>{format(new Date(ticket.resolved_at), 'MMM d, yyyy')}</dd>
                </div>
              )}
              {ticket.resolution_time_hours !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Resolution time</dt>
                  <dd className="font-medium">{ticket.resolution_time_hours}h</dd>
                </div>
              )}
              {!ticket.ai_processed && (
                <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded-lg text-center animate-pulse">
                  AI analysis in progress…
                </div>
              )}
            </dl>
          </div>

          {/* Tags */}
          {ticket.tags?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 text-sm mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((tag) => (
                  <span key={tag.id} className="badge bg-gray-100 text-gray-700">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
