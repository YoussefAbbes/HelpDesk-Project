/**
 * NotFoundPage — styled 404 error page.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 illustration */}
        <div className="relative mb-8">
          <div className="text-[150px] md:text-[200px] font-bold text-gray-200 dark:text-gray-800 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-6 bg-white dark:bg-dark-card rounded-full shadow-2xl">
              <Search className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button variant="primary" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-border">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Popular pages:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/tickets"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View Tickets
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              to="/tickets/new"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Create Ticket
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              to="/profile"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Profile
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              to="/settings"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
