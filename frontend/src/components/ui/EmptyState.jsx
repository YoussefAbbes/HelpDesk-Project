/**
 * EmptyState - Display when there's no content to show
 *
 * Features:
 * - Customizable illustration
 * - Title and description
 * - Optional action button
 * - Predefined variants for common states
 */

import React from 'react'
import {
  Inbox,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Bell,
  Users,
  BarChart3,
} from 'lucide-react'
import Button from './Button'

// Predefined illustrations
const illustrations = {
  noData: Inbox,
  noResults: Search,
  noTickets: FileText,
  error: AlertCircle,
  success: CheckCircle,
  noNotifications: Bell,
  noUsers: Users,
  noAnalytics: BarChart3,
}

export default function EmptyState({
  icon: Icon,
  illustration = 'noData',
  title = 'No data found',
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  className = '',
  children,
}) {
  const IllustrationIcon = Icon || illustrations[illustration] || Inbox

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        py-12 px-4
        ${className}
      `}
    >
      {/* Illustration container */}
      <div className="relative mb-6">
        {/* Background glow */}
        <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-2xl opacity-60" />

        {/* Icon container */}
        <div
          className="
            relative w-20 h-20
            flex items-center justify-center
            bg-gradient-to-br from-gray-100 to-gray-50
            dark:from-dark-card dark:to-dark-hover
            rounded-2xl
            shadow-soft
          "
        >
          <IllustrationIcon
            className="w-10 h-10 text-gray-400 dark:text-gray-500"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}

      {/* Custom content */}
      {children}
    </div>
  )
}

// Predefined empty states
export function NoTickets({ onCreateTicket }) {
  return (
    <EmptyState
      illustration="noTickets"
      title="No tickets yet"
      description="When you or your customers create support tickets, they'll appear here."
      actionLabel="Create your first ticket"
      onAction={onCreateTicket}
    />
  )
}

export function NoSearchResults({ searchTerm, onClearSearch }) {
  return (
    <EmptyState
      illustration="noResults"
      title="No results found"
      description={`We couldn't find any matches for "${searchTerm}". Try adjusting your search or filters.`}
      actionLabel="Clear search"
      onAction={onClearSearch}
      actionVariant="secondary"
    />
  )
}

export function NoNotifications() {
  return (
    <EmptyState
      illustration="noNotifications"
      title="All caught up!"
      description="You have no new notifications. We'll notify you when something happens."
    />
  )
}

export function ErrorState({ onRetry, message }) {
  return (
    <EmptyState
      illustration="error"
      title="Something went wrong"
      description={message || "We had trouble loading this content. Please try again."}
      actionLabel="Try again"
      onAction={onRetry}
    />
  )
}

export function SuccessState({ title, message }) {
  return (
    <EmptyState
      illustration="success"
      title={title || "Success!"}
      description={message}
    />
  )
}
