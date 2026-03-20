/**
 * NotificationDropdown — displays user notifications in a dropdown.
 *
 * Features:
 * - Unread count badge
 * - List of notifications with time ago
 * - Mark as read on click
 * - Navigate to related ticket
 * - Mark all as read action
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import useNotificationStore from '../store/notificationStore'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore()

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    if (notification.ticket_id) {
      navigate(`/tickets/${notification.ticket_id}`)
    }
    setIsOpen(false)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteNotification(id)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-error-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer transition-colors group ${
                    !notification.is_read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                        )}
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {notification.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {notification.time_ago}
                        </span>
                        {notification.ticket_title && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {notification.ticket_title}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="p-1.5 text-gray-400 hover:text-error-500 dark:hover:text-error-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
