/**
 * Sentiment badge — colour-coded indicator for AI-predicted ticket sentiment with dark mode support.
 */

import React from 'react'

const SENTIMENT_CONFIG = {
  POSITIVE: { label: 'Positive', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  NEUTRAL: { label: 'Neutral', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  NEGATIVE: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
}

export default function SentimentBadge({ sentiment, score }) {
  if (!sentiment) return null
  const config = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.NEUTRAL
  return (
    <span className={`badge ${config.className}`} title={score ? `Confidence: ${(score * 100).toFixed(0)}%` : undefined}>
      {config.label}
      {score && (
        <span className="ml-1 opacity-60 text-[10px]">({(score * 100).toFixed(0)}%)</span>
      )}
    </span>
  )
}
