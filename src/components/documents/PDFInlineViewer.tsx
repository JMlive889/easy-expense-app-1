import React, { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Expand, Download, AlertCircle, FileText } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFInlineViewerProps {
  signedUrl: string
  onExpand: () => void
  onDownload: () => void
}

export function PDFInlineViewer({ signedUrl, onExpand, onDownload }: PDFInlineViewerProps) {
  const [loadError, setLoadError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const handleLoadSuccess = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleLoadError = useCallback(() => {
    setLoadError(true)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onExpand()
  }, [onExpand])

  const handleDownloadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload()
  }, [onDownload])

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-400 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <AlertCircle className="w-12 h-12 mb-3 text-amber-500" />
        <p className="text-sm font-medium mb-1">Preview unavailable</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 text-center">
          Could not load PDF preview
        </p>
        <button
          onClick={handleDownloadClick}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    )
  }

  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
      onClick={handleClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-100 dark:bg-gray-800">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      <div
        className={`transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ maxHeight: '380px', overflow: 'hidden' }}
      >
        <Document
          file={signedUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={1}
            width={undefined}
            className="w-full [&_canvas]:w-full! [&_canvas]:h-auto!"
            renderAnnotationLayer={false}
            renderTextLayer={false}
            scale={1.2}
          />
        </Document>
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 flex flex-col items-center gap-2">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Expand className="w-5 h-5" />
            <span className="text-sm font-semibold">View Full PDF</span>
          </div>
        </div>
      </div>

      {isLoaded && (
        <button
          onClick={handleDownloadClick}
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-2 shadow-md text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
