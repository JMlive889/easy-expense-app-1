import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onStatusChange: (newStatus: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'batched', label: 'Batched' },
];

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onStatusChange,
}: BulkActionToolbarProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApply = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      await onStatusChange(selectedStatus);
      setSelectedStatus('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {selectedCount} {selectedCount === 1 ? 'receipt' : 'receipts'} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <label htmlFor="bulk-status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Change Status:
        </label>
        <select
          id="bulk-status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={isUpdating}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select status...</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button
          onClick={handleApply}
          disabled={!selectedStatus || isUpdating}
          className="whitespace-nowrap"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Apply'
          )}
        </Button>
      </div>
    </div>
  );
}
