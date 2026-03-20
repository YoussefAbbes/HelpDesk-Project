/**
 * AttachmentList — displays file attachments for a ticket with download and delete actions.
 *
 * Features:
 * - File icons based on content type
 * - Download links
 * - Delete button (only for uploader or admin)
 * - File size display
 */

import React from 'react'
import { Download, Trash2, File, FileText, FileImage, FileVideo, FileAudio, FileArchive } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { formatFileSize, getAttachmentUrl } from '../services/attachmentService'

// Map content types to icons
function getFileIcon(contentType) {
  if (!contentType) return <File className="w-5 h-5" />

  if (contentType.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />
  if (contentType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-500" />
  if (contentType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-pink-500" />
  if (contentType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
  if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) {
    return <FileArchive className="w-5 h-5 text-yellow-600" />
  }
  if (contentType.includes('text') || contentType.includes('json') || contentType.includes('xml')) {
    return <FileText className="w-5 h-5 text-green-500" />
  }

  return <File className="w-5 h-5 text-gray-500" />
}

export default function AttachmentList({ attachments = [], onDelete }) {
  const { user } = useAuthStore()

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
        <File className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No attachments</p>
      </div>
    )
  }

  const canDelete = (attachment) => {
    if (!user) return false
    return user.id === attachment.uploaded_by?.id || user.role === 'ADMIN'
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const fileUrl = getAttachmentUrl(attachment)

        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border rounded-xl hover:shadow-sm transition-shadow group"
          >
            {/* File icon */}
            <div className="flex-shrink-0">
              {getFileIcon(attachment.content_type)}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {attachment.original_filename}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(attachment.file_size)}</span>
                {attachment.uploaded_by && (
                  <>
                    <span>•</span>
                    <span>by {attachment.uploaded_by.username}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Download button */}
              <a
                href={fileUrl}
                download={attachment.original_filename}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-dark-card hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>

              {/* Delete button (only for uploader or admin) */}
              {canDelete(attachment) && onDelete && (
                <button
                  onClick={() => onDelete(attachment.id)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-dark-card hover:text-error-600 dark:hover:text-error-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
