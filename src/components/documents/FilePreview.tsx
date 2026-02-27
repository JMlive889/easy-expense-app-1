import React from 'react'
import { X, FileText, Image as ImageIcon } from 'lucide-react'

interface FilePreviewProps {
  file: File
  onRemove: () => void
  previewUrl?: string
}

export function FilePreview({ file, onRemove, previewUrl }: FilePreviewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const isPDF = file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/')

  return (
    <div className="relative group rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : isPDF ? (
          <FileText className="w-16 h-16 text-red-500" />
        ) : (
          <ImageIcon className="w-16 h-16 text-gray-400" />
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  )
}
