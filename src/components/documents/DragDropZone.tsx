import React, { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  maxSize?: number
  multiple?: boolean
}

export function DragDropZone({
  onFilesSelected,
  accept = 'image/*,application/pdf',
  maxSize = 25 * 1024 * 1024,
  multiple = true
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div
      className={`
        relative min-h-[200px] rounded-3xl transition-all duration-300 cursor-pointer group
        ${isDragging
          ? 'border-4 border-emerald-500 bg-emerald-500/10 scale-105 brightness-110'
          : 'border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/30 hover:border-emerald-500/50'
        }
        bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Upload
          className={`
            w-16 h-16 mb-4 transition-all duration-300
            ${isDragging
              ? 'text-emerald-500 scale-110'
              : 'text-emerald-500/70 dark:text-emerald-500/70 group-hover:text-emerald-500'
            }
          `}
        />

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop or click to upload'}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Supports images and PDF files
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-500">
          Maximum file size: {formatFileSize(maxSize)}
        </p>
      </div>
    </div>
  )
}
