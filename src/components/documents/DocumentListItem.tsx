import React, { memo } from 'react'
import { FileText, Image as ImageIcon, Bookmark, Images, Lock } from 'lucide-react'
import { Document } from '../../lib/documents'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { usePdfThumbnail } from '../../hooks/usePdfThumbnail'

interface DocumentListItemProps {
  document: Document
  onClick: () => void
  onToggleBookmark: (e: React.MouseEvent) => void
  imageCount?: number
  showAmount?: boolean
}

export const DocumentListItem = memo(function DocumentListItem({ document, onClick, onToggleBookmark, imageCount = 0, showAmount = false }: DocumentListItemProps) {
  const { ref, isVisible } = useIntersectionObserver()
  const { thumbnailUrl: fallbackThumbnail, loading, isPDF } = usePdfThumbnail({
    signedUrl: document.signed_url,
    mimeType: document.mime_type,
    fileSize: document.file_size,
    isVisible,
    storedThumbnailUrl: document.thumbnail_url,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isImage = document.mime_type.startsWith('image/')
  const storedThumbnail = document.thumbnail_url
  const displayThumbnail = storedThumbnail || fallbackThumbnail
  const isLocked = document.status === 'approved' || document.status === 'batched'

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all"
    >
      {isLocked && (
        <div className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
          document.status === 'approved'
            ? 'bg-green-500 text-white'
            : 'bg-purple-500 text-white'
        }`}>
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold capitalize">{document.status}</span>
        </div>
      )}

      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
        {isImage ? (
          <img
            src={storedThumbnail || document.signed_url}
            alt={document.display_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isPDF ? (
          displayThumbnail ? (
            <img
              src={displayThumbnail}
              alt={document.display_name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : loading ? (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ) : (
            <FileText className="w-8 h-8 text-red-500" />
          )
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-400" />
        )}

        {imageCount > 1 && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Images className="w-2.5 h-2.5" />
            <span>{imageCount}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
          {document.display_name}
        </h3>

        <div className="flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-400 leading-tight">
          {document.type && (
            <span className="truncate">
              {document.type.replace('-', ' ')}
            </span>
          )}
          {document.vendor && (
            <span className="truncate">{document.vendor}</span>
          )}
          <span>{formatDate(document.created_at)}</span>
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {document.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-sm hidden sm:block">
        {showAmount
          ? document.amount != null
            ? <span className="font-semibold text-gray-900 dark:text-white">${document.amount.toFixed(2)}</span>
            : <span className="text-gray-400 dark:text-gray-600">—</span>
          : <span className="text-gray-600 dark:text-gray-400">{formatFileSize(document.file_size)}</span>
        }
      </div>

      <button
        onClick={onToggleBookmark}
        className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Bookmark
          className={`w-5 h-5 ${
            document.bookmark
              ? 'fill-emerald-500 text-emerald-500'
              : 'text-gray-400'
          }`}
        />
      </button>
    </div>
  )
})
