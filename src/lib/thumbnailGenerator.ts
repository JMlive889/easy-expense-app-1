import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const THUMBNAIL_WIDTH = 400
const THUMBNAIL_QUALITY = 0.7

export async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale: 1 })
    const scale = THUMBNAIL_WIDTH / viewport.width
    const scaledViewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to get canvas context')
    }

    await page.render({
      canvas,
      viewport: scaledViewport,
    }).promise

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png', THUMBNAIL_QUALITY)
    })
  } catch (error) {
    console.error('Failed to generate PDF thumbnail:', error)
    return null
  }
}

export async function generateImageThumbnail(file: File): Promise<Blob | null> {
  try {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        let { width, height } = img

        if (width > THUMBNAIL_WIDTH) {
          const scale = THUMBNAIL_WIDTH / width
          width = THUMBNAIL_WIDTH
          height = height * scale
        }

        canvas.width = width
        canvas.height = height

        context.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', THUMBNAIL_QUALITY)
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }

      img.src = objectUrl
    })
  } catch (error) {
    console.error('Failed to generate image thumbnail:', error)
    return null
  }
}

export async function generateThumbnail(file: File): Promise<Blob | null> {
  if (file.type === 'application/pdf') {
    return generatePdfThumbnail(file)
  } else if (file.type.startsWith('image/')) {
    return generateImageThumbnail(file)
  }
  return null
}
