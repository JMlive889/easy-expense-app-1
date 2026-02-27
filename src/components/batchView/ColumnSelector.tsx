import React, { useState } from 'react';
import { X, GripVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { AVAILABLE_COLUMNS } from '../../lib/batchReports';

interface ColumnSelectorProps {
  visibleColumns: string[];
  columnOrder: string[];
  onApply: (visibleColumns: string[], columnOrder: string[]) => void;
  onClose: () => void;
}

export function ColumnSelector({ visibleColumns, columnOrder, onApply, onClose }: ColumnSelectorProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(visibleColumns);
  const [orderedColumns, setOrderedColumns] = useState<string[]>(
    columnOrder.length > 0 ? columnOrder : AVAILABLE_COLUMNS.map(col => col.key)
  );

  const toggleColumn = (columnKey: string) => {
    if (selectedColumns.includes(columnKey)) {
      setSelectedColumns(selectedColumns.filter(key => key !== columnKey));
    } else {
      setSelectedColumns([...selectedColumns, columnKey]);
    }
  };

  const moveColumnUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedColumns];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedColumns(newOrder);
  };

  const moveColumnDown = (index: number) => {
    if (index === orderedColumns.length - 1) return;
    const newOrder = [...orderedColumns];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedColumns(newOrder);
  };

  const handleApply = () => {
    onApply(selectedColumns, orderedColumns);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adjust Columns</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select which columns to display and adjust their order.
          </p>

          <div className="space-y-2">
            {orderedColumns.map((columnKey, index) => {
              const column = AVAILABLE_COLUMNS.find(col => col.key === columnKey);
              if (!column) return null;

              const isVisible = selectedColumns.includes(columnKey);

              return (
                <div
                  key={columnKey}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveColumnUp(index)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <span className="text-xs">▲</span>
                    </button>
                    <button
                      onClick={() => moveColumnDown(index)}
                      disabled={index === orderedColumns.length - 1}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <span className="text-xs">▼</span>
                    </button>
                  </div>

                  <GripVertical className="w-4 h-4 text-gray-400" />

                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleColumn(columnKey)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {column.label}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
