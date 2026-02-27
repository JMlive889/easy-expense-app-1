import React, { useRef } from 'react'
import { Plus } from 'lucide-react'

interface UploadButtonProps {
  onFileSelected: (file: File) => void
  accept?: string
  title?: string
  className?: string
  icon?: React.ReactNode
}

export function UploadButton({
  onFileSelected,
  accept = '*/*',
  title = 'Upload file',
  className = '',
  icon
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      onFileSelected(file)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const defaultClassName = className || 'p-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all hover:scale-110 active:scale-95'

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className={defaultClassName}
        title={title}
      >
        {icon || <Plus className="w-6 h-6" />}
      </button>
    </>
  )
}
