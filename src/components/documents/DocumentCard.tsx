import React, { memo } from 'react'
import { FileText, Image as ImageIcon, Bookmark, Images, Lock } from 'lucide-react'
import { Document } from '../../lib/documents'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { usePdfThumbnail } from '../../hooks/usePdfThumbnail'

interface DocumentCardProps {
  document: Document
  onClick: () => void
  onToggleBookmark: (e: React.MouseEvent) => void
  imageCount?: number
  showAmount?: boolean
}

export const DocumentCard = memo(function DocumentCard({ document, onClick, onToggleBookmark, imageCount = 0, showAmount = false }: DocumentCardProps) {
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
      className="group relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-emerald-500/30 bg-white dark:bg-gray-900 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
    >
      {isLocked && (
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg flex items-center gap-1.5 ${
          document.status === 'approved'
            ? 'bg-green-500/90 text-white'
            : 'bg-purple-500/90 text-white'
        }`}>
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold capitalize">{document.status}</span>
        </div>
      )}

      <button
        onClick={onToggleBookmark}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all shadow-lg"
      >
        <Bookmark
          className={`w-5 h-5 ${
            document.bookmark
              ? 'fill-emerald-500 text-emerald-500'
              : 'text-gray-400'
          }`}
        />
      </button>

      <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800 relative">
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
            <FileText className="w-16 h-16 text-red-500" />
          )
        ) : (
          <ImageIcon className="w-16 h-16 text-gray-400" />
        )}

        {imageCount > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <Images className="w-3 h-3" />
            <span>{imageCount}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
          {document.display_name}
        </h3>

        {document.type && (
          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mb-2">
            {document.type.replace('-', ' ')}
          </span>
        )}

        {document.vendor && (
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 truncate">
            {document.vendor}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {showAmount
              ? document.amount != null
                ? <span className="font-semibold text-gray-900 dark:text-white text-sm">${document.amount.toFixed(2)}</span>
                : <span className="text-gray-400 dark:text-gray-600">—</span>
              : formatFileSize(document.file_size)
            }
          </span>
          <span>{formatDate(document.created_at)}</span>
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {document.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
            {document.tags.length > 2 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                +{document.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
