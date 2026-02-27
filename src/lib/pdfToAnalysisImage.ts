import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const ANALYSIS_SCALE = 1.75
const ANALYSIS_QUALITY = 0.92

export interface PdfConversionResult {
  imageBase64: string | null
  extractedText: string | null
  pageCount: number
  conversionError: string | null
}

async function loadPdfDocument(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }

  const blob = await response.blob()
  const arrayBuffer = await blob.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  })

  return loadingTask.promise
}

async function renderPageToBase64(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale: ANALYSIS_SCALE })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({ canvas, viewport }).promise

  const dataUrl = canvas.toDataURL('image/jpeg', ANALYSIS_QUALITY)

  canvas.width = 0
  canvas.height = 0

  return dataUrl
}

async function extractPageTextLayer(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string | null> {
  try {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    const text = textContent.items
      .map((item) => {
        if ('str' in item) return item.str
        return ''
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    return text.length > 0 ? text : null
  } catch {
    return null
  }
}

export async function preparePdfForAnalysis(url: string): Promise<PdfConversionResult> {
  let pdf: pdfjsLib.PDFDocumentProxy | null = null
  let imageBase64: string | null = null
  let extractedText: string | null = null
  let pageCount = 0
  let conversionError: string | null = null

  try {
    pdf = await loadPdfDocument(url)
    pageCount = pdf.numPages
  } catch (err) {
    conversionError = err instanceof Error ? err.message : 'Failed to load PDF'
    return { imageBase64, extractedText, pageCount, conversionError }
  }

  try {
    imageBase64 = await renderPageToBase64(pdf, 1)
  } catch (err) {
    conversionError = err instanceof Error ? err.message : 'Failed to render PDF page'
  }

  try {
    extractedText = await extractPageTextLayer(pdf, 1)
  } catch {
    // Text extraction failure is non-fatal
  }

  return { imageBase64, extractedText, pageCount, conversionError }
}
