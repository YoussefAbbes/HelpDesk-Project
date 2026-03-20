/**
 * FileUploader - Drag and drop file upload component
 *
 * Features:
 * - Drag and drop support
 * - Click to select files
 * - File type validation
 * - Size limit enforcement
 * - Progress indicator
 * - Preview for images
 * - Multiple file support
 */

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image, FileText, Film, Music, AlertCircle } from 'lucide-react'

// File type to icon mapping
const fileIcons = {
  image: Image,
  video: Film,
  audio: Music,
  document: FileText,
  default: File,
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return fileIcons.image
  if (type.startsWith('video/')) return fileIcons.video
  if (type.startsWith('audio/')) return fileIcons.audio
  if (type.includes('pdf') || type.includes('document') || type.includes('text'))
    return fileIcons.document
  return fileIcons.default
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileUploader({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  multiple = true,
  className = '',
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState([])
  const inputRef = useRef(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFile = useCallback(
    (file) => {
      const errors = []

      // Check file size
      if (file.size > maxSizeBytes) {
        errors.push(`File exceeds ${maxSizeMB}MB limit`)
      }

      // Check file type
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''))
        }
        return file.type === type
      })

      if (!isAccepted) {
        errors.push('File type not allowed')
      }

      return errors
    },
    [maxSizeBytes, acceptedTypes, maxSizeMB]
  )

  const handleFiles = useCallback(
    (newFiles) => {
      const fileArray = Array.from(newFiles)
      const validFiles = []
      const newErrors = []

      // Check max files limit
      if (files.length + fileArray.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`)
        return
      }

      fileArray.forEach((file) => {
        const fileErrors = validateFile(file)
        if (fileErrors.length > 0) {
          newErrors.push(`${file.name}: ${fileErrors.join(', ')}`)
        } else {
          // Create preview for images
          const fileWithPreview = {
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview: file.type.startsWith('image/')
              ? URL.createObjectURL(file)
              : null,
          }
          validFiles.push(fileWithPreview)
        }
      })

      setErrors(newErrors)

      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles]
        setFiles(updatedFiles)
        onFilesSelected?.(updatedFiles.map((f) => f.file))
      }
    },
    [files, maxFiles, validateFile, onFilesSelected]
  )

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault()
      if (!disabled) setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      if (!disabled && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [disabled, handleFiles]
  )

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const removeFile = (id) => {
    const fileToRemove = files.find((f) => f.id === id)
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
    const updatedFiles = files.filter((f) => f.id !== id)
    setFiles(updatedFiles)
    onFilesSelected?.(updatedFiles.map((f) => f.file))
  }

  const clearAll = () => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setFiles([])
    setErrors([])
    onFilesSelected?.([])
  }

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8
          transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center gap-3
          ${
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-hover'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${isDragging ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-dark-card'}
            transition-colors
          `}
        >
          <Upload
            className={`w-6 h-6 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`}
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {isDragging ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            or click to browse
          </p>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Max {maxSizeMB}MB per file • Up to {maxFiles} files
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((error, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-error-600 dark:hover:text-error-400"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {files.map((fileData) => {
              const FileIcon = getFileIcon(fileData.file.type)
              return (
                <div
                  key={fileData.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-card rounded-xl"
                >
                  {/* Preview or Icon */}
                  {fileData.preview ? (
                    <img
                      src={fileData.preview}
                      alt={fileData.file.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-dark-hover flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-gray-500" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {fileData.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileData.file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="p-1.5 text-gray-400 hover:text-error-600 dark:hover:text-error-400 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact variant for inline use
export function CompactFileUploader({
  onFileSelected,
  accept = 'image/*',
  maxSizeMB = 5,
  disabled = false,
  className = '',
  children,
}) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File exceeds ${maxSizeMB}MB limit`)
        return
      }
      onFileSelected?.(file)
    }
    e.target.value = ''
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <div onClick={() => !disabled && inputRef.current?.click()}>
        {children || (
          <button
            type="button"
            disabled={disabled}
            className="btn-secondary"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        )}
      </div>
    </div>
  )
}
