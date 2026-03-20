/**
 * TicketCard — summary card for the ticket list view.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Cpu } from 'lucide-react'
import SentimentBadge from './SentimentBadge'
import { StatusBadge, PriorityBadge } from './StatusBadge'

export default function TicketCard({ ticket }) {
  const createdAgo = formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })

  return (
    <Link to={`/tickets/${ticket.id}`} className="block hover:shadow-md transition-shadow">
      <div className="card cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          {/* Title & metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{ticket.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              #{ticket.id} · {ticket.created_by?.username} · {createdAgo}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.ai_processed && (
              <SentimentBadge sentiment={ticket.ai_sentiment} score={ticket.ai_sentiment_score} />
            )}
            {!ticket.ai_processed && (
              <span className="badge bg-purple-100 text-purple-700 animate-pulse">
                <Cpu className="w-3 h-3 mr-1 inline" />AI processing…
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          {ticket.ai_category && (
            <span className="badge bg-indigo-50 text-indigo-700">
              {ticket.ai_category.replace('_', ' ')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {ticket.message_count} messages
          </span>
          {ticket.assigned_to && (
            <span>
              Agent: <strong>{ticket.assigned_to.username}</strong>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
