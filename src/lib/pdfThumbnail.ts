import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const MAX_FILE_SIZE = 10 * 1024 * 1024
const THUMBNAIL_SCALE = 0.4
const THUMBNAIL_QUALITY = 0.7

const thumbnailCache = new Map<string, string>()

export async function generatePdfThumbnail(
  url: string,
  fileSize?: number
): Promise<string | null> {
  if (thumbnailCache.has(url)) {
    return thumbnailCache.get(url)!
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    console.warn(`PDF file size (${fileSize}) exceeds maximum (${MAX_FILE_SIZE})`)
    return null
  }

  try {
    console.log('Fetching PDF from URL:', url)

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    console.log('PDF blob fetched, size:', blob.size, 'type:', blob.type)

    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    console.log('Loading PDF document...')
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    })

    const pdf = await loadingTask.promise
    console.log('PDF loaded, pages:', pdf.numPages)

    const page = await pdf.getPage(1)
    console.log('First page loaded')

    const viewport = page.getViewport({ scale: THUMBNAIL_SCALE })

    const canvas = document.createElement('canvas')
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvas,
      viewport: viewport,
    }

    console.log('Rendering PDF page...')
    await page.render(renderContext).promise
    console.log('PDF page rendered successfully')

    const thumbnailUrl = canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY)

    thumbnailCache.set(url, thumbnailUrl)

    canvas.width = 0
    canvas.height = 0

    return thumbnailUrl
  } catch (error) {
    console.error('Failed to generate PDF thumbnail:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return null
  }
}

export function clearThumbnailCache() {
  thumbnailCache.clear()
}
