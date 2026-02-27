import { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText, AlertCircle } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerModalProps {
  signedUrl: string
  documentName: string
  onClose: () => void
  onDownload: () => void
}

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0]
const DEFAULT_ZOOM_INDEX = 2

export function PDFViewerModal({ signedUrl, documentName, onClose, onDownload }: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [loadError, setLoadError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)

  const scale = ZOOM_STEPS[zoomIndex]

  const handleLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoaded(true)
  }, [])

  const handleLoadError = useCallback(() => {
    setLoadError(true)
  }, [])

  const goToPrev = useCallback(() => {
    setPageNumber(p => Math.max(p - 1, 1))
  }, [])

  const goToNext = useCallback(() => {
    setPageNumber(p => Math.min(p + 1, numPages ?? 1))
  }, [numPages])

  const zoomIn = useCallback(() => {
    setZoomIndex(i => Math.min(i + 1, ZOOM_STEPS.length - 1))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomIndex(i => Math.max(i - 1, 0))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button') || target.closest('select')) return
    const el = scrollRef.current
    if (!el) return
    dragStart.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    setIsDragging(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart.current || !scrollRef.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx
    scrollRef.current.scrollTop = dragStart.current.scrollTop - dy
  }, [])

  const handleMouseUp = useCallback(() => {
    dragStart.current = null
    setIsDragging(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPrev()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToNext()
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPrev, goToNext, zoomIn, zoomOut])

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-gray-950/95 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-3 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-100 truncate">{documentName}</span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isLoaded && numPages && numPages > 1 && (
            <>
              <button
                onClick={goToPrev}
                disabled={pageNumber <= 1}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-300 px-2 min-w-[70px] text-center tabular-nums">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={goToNext}
                disabled={pageNumber >= (numPages ?? 1)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-gray-700 mx-1" />
            </>
          )}

          {isLoaded && (
            <>
              <button
                onClick={zoomOut}
                disabled={zoomIndex === 0}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 w-10 text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-gray-700 mx-1" />
            </>
          )}

          <button
            onClick={onDownload}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all ml-1"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <AlertCircle className="w-16 h-16 mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Failed to load PDF</h3>
            <p className="text-sm text-center mb-6 max-w-sm">
              The document could not be loaded. Try downloading it instead.
            </p>
            <button
              onClick={onDownload}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        ) : (
          <div className="min-h-full flex flex-col items-center py-6 px-4" style={{ minWidth: 'max-content' }}>
            {!isLoaded && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <FileText className="w-12 h-12 text-gray-600 animate-pulse" />
                <p className="text-sm text-gray-500">Loading PDF...</p>
              </div>
            )}

            <Document
              file={signedUrl}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={null}
              error={null}
              className={isLoaded ? 'block' : 'hidden'}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                className="shadow-2xl"
              />
            </Document>

            {isLoaded && numPages && numPages > 1 && (
              <div className="flex items-center gap-3 mt-6 bg-gray-800 rounded-xl px-4 py-2">
                <button
                  onClick={goToPrev}
                  disabled={pageNumber <= 1}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-300 tabular-nums">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  onClick={goToNext}
                  disabled={pageNumber >= numPages}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
