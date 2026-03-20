/**
 * Notification service — API calls for in-app notifications.
 */

import api from './api'

/**
 * Fetch all notifications for the current user.
 */
export async function getNotifications() {
  const { data } = await api.get('/notifications/')
  return data
}

/**
 * Get the count of unread notifications.
 */
export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count/')
  return data.unread_count
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(id) {
  const { data } = await api.post(`/notifications/${id}/mark-read/`)
  return data
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead() {
  const { data } = await api.post('/notifications/mark-all-read/')
  return data
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(id) {
  await api.delete(`/notifications/${id}/`)
}

/**
 * Clear all notifications for the current user.
 */
export async function clearAllNotifications() {
  const { data } = await api.delete('/notifications/clear-all/')
  return data
}
