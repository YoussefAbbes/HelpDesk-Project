/**
 * Zustand store for notifications.
 *
 * Manages the list of user notifications and provides actions to:
 * - Fetch notifications from the API
 * - Mark notifications as read
 * - Delete notifications
 * - Track unread count
 */

import { create } from 'zustand'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notificationService'

const useNotificationStore = create((set, get) => ({
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  /**
   * Fetch all notifications from the API.
   */
  fetchNotifications: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getNotifications()
      const unread = data.filter((n) => !n.is_read).length
      set({ notifications: data, unreadCount: unread, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  /**
   * Fetch only the unread count (lightweight).
   */
  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadCount()
      set({ unreadCount: count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (id) => {
    try {
      await markAsRead(id)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  },

  /**
   * Mark all notifications as read.
   */
  markAllAsRead: async () => {
    try {
      await markAllAsRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  },

  /**
   * Delete a notification.
   */
  deleteNotification: async (id) => {
    try {
      await deleteNotification(id)
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id)
        const wasUnread = notification && !notification.is_read
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        }
      })
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  },

  /**
   * Clear all notifications.
   */
  clearAll: async () => {
    try {
      await clearAllNotifications()
      set({ notifications: [], unreadCount: 0 })
    } catch (error) {
      console.error('Failed to clear all notifications:', error)
    }
  },
}))

export default useNotificationStore
