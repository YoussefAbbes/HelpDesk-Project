/**
 * Attachment service — API calls for file attachments.
 */

import api from './api'

/**
 * Upload a file attachment to a ticket.
 * @param {number} ticketId - The ticket ID
 * @param {File} file - The file to upload
 * @param {number} messageId - Optional message ID to attach to
 */
export async function uploadAttachment(ticketId, file, messageId = null) {
  const formData = new FormData()
  formData.append('file', file)
  if (messageId) {
    formData.append('message_id', messageId)
  }

  const { data } = await api.post(`/tickets/${ticketId}/attachments/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

/**
 * Get all attachments for a ticket.
 */
export async function getTicketAttachments(ticketId) {
  const { data } = await api.get(`/tickets/${ticketId}/attachments/`)
  return data
}

/**
 * Delete an attachment by ID.
 */
export async function deleteAttachment(attachmentId) {
  await api.delete(`/tickets/attachments/${attachmentId}/`)
}

/**
 * Download an attachment (returns the file URL).
 */
export function getAttachmentUrl(attachment) {
  return attachment.file_url || attachment.file
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`
}
