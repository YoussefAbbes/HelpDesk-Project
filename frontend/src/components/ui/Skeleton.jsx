/**
 * Skeleton - Loading placeholder components with shimmer effect
 *
 * Variants:
 * - Text (single line)
 * - Paragraph (multiple lines)
 * - Avatar (circular)
 * - Card (rectangular)
 * - TicketCard (specific to ticket list)
 */

import React from 'react'

// Base skeleton with shimmer effect
function SkeletonBase({ className = '', ...props }) {
  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700 rounded
        relative overflow-hidden
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent
        dark:before:via-white/10
        before:animate-shimmer
        ${className}
      `}
      {...props}
    />
  )
}

// Single line of text
export function SkeletonText({ width = '100%', className = '' }) {
  return (
    <SkeletonBase
      className={`h-4 ${className}`}
      style={{ width }}
    />
  )
}

// Multiple lines of text
export function SkeletonParagraph({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText
          key={i}
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  )
}

// Circular avatar
export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <SkeletonBase
      className={`rounded-full ${sizeClasses[size]} ${className}`}
    />
  )
}

// Rectangular card
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="flex items-start gap-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <SkeletonText width="60%" />
          <SkeletonText width="40%" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonParagraph lines={2} />
      </div>
    </div>
  )
}

// Ticket card skeleton
export function SkeletonTicketCard({ className = '' }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <SkeletonText width="70%" className="h-5 mb-2" />
          <SkeletonText width="40%" className="h-3" />
        </div>
        <div className="flex gap-2">
          <SkeletonBase className="w-16 h-6 rounded-full" />
          <SkeletonBase className="w-16 h-6 rounded-full" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="sm" />
          <SkeletonText width="80px" className="h-3" />
        </div>
        <SkeletonText width="100px" className="h-3" />
      </div>
    </div>
  )
}

// KPI card skeleton
export function SkeletonKPICard({ className = '' }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="flex items-center gap-4">
        <SkeletonBase className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonText width="60%" className="h-3" />
          <SkeletonText width="40%" className="h-6" />
          <SkeletonText width="50%" className="h-3" />
        </div>
      </div>
    </div>
  )
}

// Table row skeleton
export function SkeletonTableRow({ columns = 4, className = '' }) {
  return (
    <tr className={`animate-pulse ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonText width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  )
}

// Table skeleton
export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-dark-border ${className}`}>
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-dark-card">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <SkeletonText width="60%" className="h-3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Button skeleton
export function SkeletonButton({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  }

  return (
    <SkeletonBase className={`rounded-xl ${sizeClasses[size]} ${className}`} />
  )
}

// Image skeleton
export function SkeletonImage({ aspectRatio = '16/9', className = '' }) {
  return (
    <SkeletonBase
      className={`w-full ${className}`}
      style={{ aspectRatio }}
    />
  )
}

// Export base for custom skeletons
export { SkeletonBase as Skeleton }

// Default export as an object with all variants
const SkeletonComponents = {
  Base: SkeletonBase,
  Text: SkeletonText,
  Paragraph: SkeletonParagraph,
  Avatar: SkeletonAvatar,
  Card: SkeletonCard,
  TicketCard: SkeletonTicketCard,
  KPICard: SkeletonKPICard,
  TableRow: SkeletonTableRow,
  Table: SkeletonTable,
  Button: SkeletonButton,
  Image: SkeletonImage,
}

export default SkeletonComponents
