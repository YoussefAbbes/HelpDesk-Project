/**
 * StatusBadge — colour-coded badge for ticket status with dark mode support.
 */

import React from 'react'

const STATUS_CONFIG = {
  OPEN: { label: 'Open', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
  RESOLVED: { label: 'Resolved', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
}

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 font-bold ring-2 ring-red-200 dark:ring-red-800' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
  return <span className={`badge ${config.className}`}>{config.label}</span>
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || { label: priority, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
  return <span className={`badge ${config.className}`}>{config.label}</span>
}
