import { useEffect, useState } from 'react'
import { generatePdfThumbnail } from '../lib/pdfThumbnail'

interface UsePdfThumbnailOptions {
  signedUrl: string | null | undefined
  mimeType: string
  fileSize: number
  isVisible: boolean
  storedThumbnailUrl?: string | null
}

export function usePdfThumbnail({
  signedUrl,
  mimeType,
  fileSize,
  isVisible,
  storedThumbnailUrl,
}: UsePdfThumbnailOptions) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const isPDF = mimeType === 'application/pdf'

  useEffect(() => {
    if (!isPDF || !signedUrl || !isVisible || loading || thumbnailUrl || error || storedThumbnailUrl) {
      return
    }

    let isMounted = true

    const generateThumbnail = async () => {
      setLoading(true)
      console.log('Starting PDF thumbnail generation for:', signedUrl.substring(0, 100) + '...')

      try {
        const url = await generatePdfThumbnail(signedUrl, fileSize)

        if (isMounted) {
          if (url) {
            console.log('PDF thumbnail generated successfully')
            setThumbnailUrl(url)
          } else {
            console.warn('PDF thumbnail generation returned null')
            setError(true)
          }
        }
      } catch (err) {
        console.error('Failed to generate thumbnail:', err)
        if (isMounted) {
          setError(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    generateThumbnail()

    return () => {
      isMounted = false
    }
  }, [isPDF, signedUrl, isVisible, fileSize, loading, thumbnailUrl, error, storedThumbnailUrl])

  return {
    thumbnailUrl,
    loading: isPDF && loading,
    error,
    isPDF,
  }
}
