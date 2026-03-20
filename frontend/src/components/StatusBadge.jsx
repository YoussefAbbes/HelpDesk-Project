/**
 * StatusBadge — colour-coded badge for ticket status.
 */

import React from 'react'

const STATUS_CONFIG = {
  OPEN: { label: 'Open', className: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
  PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-800' },
  RESOLVED: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-600' },
}

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800 font-bold' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  return <span className={`badge ${config.className}`}>{config.label}</span>
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || { label: priority, className: 'bg-gray-100 text-gray-700' }
  return <span className={`badge ${config.className}`}>{config.label}</span>
}
