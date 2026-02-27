import React, { useState } from 'react'
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react'
import { VendorAutocomplete } from './VendorAutocomplete'
import { TagMultiSelect } from './TagMultiSelect'
import { Button } from '../ui/Button'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../ui/ConfirmModal'
import { uploadDocument } from '../../lib/documents'

interface ReceiptRow {
  id: string
  vendor: string
  date: string
  amount: string
  file: File | null
  tags: string[]
  previewUrl?: string
  reimbursable: boolean
  billable: boolean
}

interface EnterMultipleFormProps {
  availableVendors: string[]
  availableTags: string[]
  onSuccess: () => void
}

export function EnterMultipleForm({ availableVendors, availableTags, onSuccess }: EnterMultipleFormProps) {
  const { showToast } = useToast()
  const [rows, setRows] = useState<ReceiptRow[]>([
    { id: '1', vendor: '', date: new Date().toISOString().split('T')[0], amount: '', file: null, tags: [], reimbursable: false, billable: false }
  ])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

  const addRow = () => {
    if (rows.length >= 10) {
      showToast('Maximum of 10 receipts at once', 'error')
      return
    }
    const newRow: ReceiptRow = {
      id: Date.now().toString(),
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      file: null,
      tags: [],
      reimbursable: false,
      billable: false
    }
    setRows([...rows, newRow])
  }

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      showToast('At least one row is required', 'error')
      return
    }
    setRows(rows.filter(row => row.id !== id))
  }

  const updateRow = (id: string, updates: Partial<ReceiptRow>) => {
    setRows(rows.map(row => row.id === id ? { ...row, ...updates } : row))
  }

  const handleFileSelect = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 25 * 1024 * 1024) {
      showToast('File size must be less than 25MB', 'error')
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/heic']
    if (!validTypes.includes(file.type)) {
      showToast('Only JPG, PNG, PDF, and HEIC files are allowed', 'error')
      return
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    updateRow(id, { file, previewUrl })
  }

  const validateRows = () => {
    const validRows = rows.filter(row => row.vendor && row.date && row.amount && row.file)
    const invalidRows = rows.filter(row => !(row.vendor && row.date && row.amount && row.file))

    if (validRows.length === 0) {
      showToast('Please complete at least one row', 'error')
      return { valid: false, validRows: [], invalidRows: [] }
    }

    return { valid: true, validRows, invalidRows }
  }

  const handleSubmit = () => {
    const validation = validateRows()
    if (!validation.valid) return

    setShowConfirmModal(true)
  }

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false)
    const validation = validateRows()
    if (!validation.valid) return

    setIsUploading(true)
    setUploadProgress({ current: 0, total: validation.validRows.length })

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < validation.validRows.length; i++) {
      const row = validation.validRows[i]
      setUploadProgress({ current: i + 1, total: validation.validRows.length })

      try {
        const amount = parseFloat(row.amount)
        const { error } = await uploadDocument({
          file: row.file!,
          displayName: `${row.vendor} - $${amount.toFixed(2)}`,
          type: 'receipt',
          vendor: row.vendor,
          amount,
          tags: row.tags,
          bookmarked: false,
          reimbursable: row.reimbursable,
          billable: row.billable
        })

        if (error) {
          results.failed++
          results.errors.push(`${row.vendor}: ${error.message}`)
        } else {
          results.successful++
        }
      } catch (error) {
        results.failed++
        results.errors.push(`${row.vendor}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    setIsUploading(false)

    if (results.successful > 0) {
      showToast(
        `Successfully created ${results.successful} receipt${results.successful !== 1 ? 's' : ''}${
          results.failed > 0 ? `. ${results.failed} failed.` : ''
        }`,
        results.failed > 0 ? 'error' : 'success'
      )

      setRows([
        { id: Date.now().toString(), vendor: '', date: new Date().toISOString().split('T')[0], amount: '', file: null, tags: [], reimbursable: false, billable: false }
      ])

      onSuccess()
    } else {
      showToast('All uploads failed. Please try again.', 'error')
    }
  }

  const completeRows = rows.filter(row => row.vendor && row.date && row.amount && row.file).length

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Enter up to 10 receipts at once. Each receipt will be saved individually and can only be edited individually after submission.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[950px]">
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_auto_auto_1.5fr_2fr_auto] gap-3 mb-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Vendor</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Date</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Amount</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-center">Reimb.</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-center">Bill.</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Image</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Tags</div>
            <div className="w-10"></div>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[2fr_1.5fr_1.5fr_auto_auto_1.5fr_2fr_auto] gap-3 items-center p-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div>
                  <VendorAutocomplete
                    value={row.vendor}
                    onChange={(vendor) => updateRow(row.id, { vendor })}
                    vendors={availableVendors}
                    placeholder="Vendor name"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, { date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={row.reimbursable}
                    onChange={(e) => updateRow(row.id, { reimbursable: e.target.checked })}
                    className="w-5 h-5 text-emerald-500 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={row.billable}
                    onChange={(e) => updateRow(row.id, { billable: e.target.checked })}
                    className="w-5 h-5 text-emerald-500 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <input
                    type="file"
                    id={`file-${row.id}`}
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileSelect(row.id, e)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`file-${row.id}`}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors cursor-pointer h-[50px]"
                  >
                    {row.previewUrl ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={row.previewUrl} alt="Preview" className="w-8 h-8 object-cover rounded" />
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm truncate flex-1">
                          {row.file?.name}
                        </span>
                      </div>
                    ) : row.file ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 text-sm truncate flex-1">
                          {row.file.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400">Upload</span>
                      </>
                    )}
                  </label>
                </div>

                <div>
                  <TagMultiSelect
                    selectedTags={row.tags}
                    onChange={(tags) => updateRow(row.id, { tags })}
                    availableTags={availableTags}
                    placeholder="Add tags"
                  />
                </div>

                <button
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove row"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {rows.length < 10 && (
            <button
              onClick={addRow}
              className="mt-3 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Row ({rows.length}/10)
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {completeRows} of {rows.length} row{rows.length !== 1 ? 's' : ''} complete
        </div>
        <Button
          onClick={handleSubmit}
          disabled={completeRows === 0 || isUploading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>Uploading {uploadProgress.current}/{uploadProgress.total}...</>
          ) : (
            <>Submit {completeRows > 0 ? `${completeRows} Receipt${completeRows !== 1 ? 's' : ''}` : 'All'}</>
          )}
        </Button>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedSubmit}
        title="Confirm Batch Submission"
        message={`When you save, each will be saved as individual expenses, and can only be edited individually. Do you wish to proceed with ${completeRows} receipt${completeRows !== 1 ? 's' : ''}?`}
        confirmText="Proceed"
        cancelText="Cancel"
      />
    </div>
  )
}
