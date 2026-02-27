import React, { useState } from 'react';
import { Settings2, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Document } from '../../lib/documents';
import { AVAILABLE_COLUMNS } from '../../lib/batchReports';
import { PageType } from '../../App';

interface ReceiptBatchTableProps {
  receipts: Document[];
  visibleColumns: string[];
  columnOrder: string[];
  onOpenColumnSelector: () => void;
  onNavigate: (page: PageType) => void;
  onRowClick?: (receipt: Document) => void;
  grandTotal?: number;
  totalCount?: number;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export function ReceiptBatchTable({
  receipts,
  visibleColumns,
  columnOrder,
  onOpenColumnSelector,
  onNavigate,
  onRowClick,
  grandTotal,
  totalCount,
  selectedIds,
  onSelectionChange,
}: ReceiptBatchTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const allSelected = receipts.length > 0 && receipts.every(r => selectedIds.includes(r.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(receipts.map(r => r.id));
    }
  };

  const handleSelectOne = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedReceipts = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return receipts;

    return [...receipts].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'user_name') {
        aValue = a.user_name || a.user_email || '';
        bValue = b.user_name || b.user_email || '';
      } else {
        aValue = a[sortColumn as keyof Document];
        bValue = b[sortColumn as keyof Document];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [receipts, sortColumn, sortDirection]);

  const orderedVisibleColumns = columnOrder.filter(key => visibleColumns.includes(key));

  const handleDocumentClick = (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onNavigate('receipts');
  };

  const formatCellValue = (receipt: Document, columnKey: string) => {
    if (columnKey === 'user_name') {
      const userName = receipt.user_name || receipt.user_email;
      if (!userName) {
        return <span className="text-gray-400">—</span>;
      }
      return userName;
    }

    if (columnKey === 'unique_id') {
      return (
        <button
          onClick={(e) => handleDocumentClick(receipt.id, e)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm font-mono"
          title={`View document ${receipt.id}`}
        >
          {receipt.id.substring(0, 8)}...
        </button>
      );
    }

    if (columnKey === 'url') {
      return (
        <button
          onClick={(e) => handleDocumentClick(receipt.id, e)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 text-sm"
          title="View document"
        >
          View
          <ExternalLink className="w-3 h-3" />
        </button>
      );
    }

    const value = receipt[columnKey as keyof Document];

    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }

    switch (columnKey) {
      case 'amount':
        return typeof value === 'number' ? `$${value.toFixed(2)}` : '—';
      case 'billable':
      case 'reimbursable':
        return value ? '✓' : '—';
      case 'created_at':
      case 'due_date':
        return new Date(value as string).toLocaleDateString();
      case 'tags':
        return Array.isArray(value) ? value.join(', ') : '—';
      case 'notes':
        return (
          <span className="max-w-xs truncate block" title={value as string}>
            {value as string}
          </span>
        );
      default:
        return String(value);
    }
  };

  if (receipts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No receipts found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                  aria-label="Select all receipts"
                />
              </th>
              {orderedVisibleColumns.map((columnKey) => {
                const column = AVAILABLE_COLUMNS.find(col => col.key === columnKey);
                if (!column) return null;

                return (
                  <th
                    key={columnKey}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => handleSort(columnKey)}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {column.label}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-right">
                <button
                  onClick={onOpenColumnSelector}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Adjust columns"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedReceipts.map((receipt, index) => {
              const isSelected = selectedIds.includes(receipt.id);
              return (
                <tr
                  key={receipt.id}
                  onClick={() => onRowClick?.(receipt)}
                  className={`${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : index % 2 === 0
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-gray-50 dark:bg-gray-900/50'
                  } ${onRowClick ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors' : ''}`}
                >
                  <td className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(receipt.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                      aria-label={`Select receipt ${receipt.display_name}`}
                    />
                  </td>
                  {orderedVisibleColumns.map((columnKey) => (
                  <td
                    key={columnKey}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {formatCellValue(receipt, columnKey)}
                  </td>
                ))}
                <td className="px-4 py-3"></td>
                </tr>
              );
            })}
            {grandTotal !== undefined && totalCount !== undefined && (
              <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                <td className="px-4 py-4"></td>
                <td
                  colSpan={orderedVisibleColumns.length}
                  className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white text-right"
                >
                  Grand Total ({totalCount} {totalCount === 1 ? 'receipt' : 'receipts'}):
                </td>
                <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white">
                  ${grandTotal.toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
