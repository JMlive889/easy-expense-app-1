import React, { useRef } from 'react'
import { Camera } from 'lucide-react'

interface CameraButtonProps {
  onCapture: (files: File[]) => void
}

export function CameraButton({ onCapture }: CameraButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      onCapture(files)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="md:hidden p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-110 active:scale-95"
        title="Take photo"
      >
        <Camera className="w-6 h-6" />
      </button>
    </>
  )
}
