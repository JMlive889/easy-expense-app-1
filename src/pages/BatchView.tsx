import React, { useState, useEffect, useMemo } from 'react';
import { Package, Save, ChevronDown, Trash2, Lock, Unlock, Download, FileText, Calendar, X, Filter } from 'lucide-react';
import { PageType } from '../App';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDocuments } from '../hooks/useDocuments';
import { ReceiptBatchTable } from '../components/batchView/ReceiptBatchTable';
import { ColumnSelector } from '../components/batchView/ColumnSelector';
import { BulkActionToolbar } from '../components/batchView/BulkActionToolbar';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Document, bulkUpdateDocumentStatus } from '../lib/documents';
import { syncExpenseReportStatus } from '../lib/expenseReports';
import {
  getSavedReports,
  createSavedReport,
  deleteSavedReport,
  SavedReport,
  DEFAULT_VISIBLE_COLUMNS,
  AVAILABLE_COLUMNS,
} from '../lib/batchReports';
import { updateHeaderVisibility } from '../lib/profiles';
import { exportToCsv } from '../utils/exportToCsv';
import { exportToPdf } from '../utils/exportToPdf';
import { ReceiptStatus, getReceiptStatusLabel, getReceiptStatusColor } from '../lib/receiptStatus';

interface BatchViewProps {
  onNavigate: (page: PageType) => void;
}

export function BatchView({ onNavigate }: BatchViewProps) {
  const { user, profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const currentEntityId = profile?.current_entity_id || '';

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [columnOrder, setColumnOrder] = useState<string[]>(AVAILABLE_COLUMNS.map(col => col.key));
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [reportName, setReportName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingHeader, setUpdatingHeader] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedStatuses, setSelectedStatuses] = useState<ReceiptStatus[]>(['submitted']);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const headerVisible = profile?.header_visible ?? true;

  const { data: receipts = [], isLoading: receiptsLoading, refetch: refetchReceipts } = useDocuments({
    type: 'receipt',
    entityId: currentEntityId,
  });

  const filteredReceipts = useMemo(() => {
    let filtered = receipts;

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(receipt =>
        selectedStatuses.includes(receipt.status as ReceiptStatus)
      );
    }

    if (fromDate) {
      filtered = filtered.filter(receipt => {
        const receiptDate = new Date(receipt.created_at);
        const filterDate = new Date(fromDate);
        return receiptDate >= filterDate;
      });
    }

    if (toDate) {
      filtered = filtered.filter(receipt => {
        const receiptDate = new Date(receipt.created_at);
        const filterDate = new Date(toDate);
        filterDate.setHours(23, 59, 59, 999);
        return receiptDate <= filterDate;
      });
    }

    return filtered;
  }, [receipts, fromDate, toDate, selectedStatuses]);

  const paginatedReceipts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReceipts.slice(startIndex, endIndex);
  }, [filteredReceipts, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredReceipts.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [fromDate, toDate, itemsPerPage, selectedStatuses]);

  useEffect(() => {
    loadSavedReports();
  }, [currentEntityId]);

  const loadSavedReports = async () => {
    if (!currentEntityId) return;

    try {
      const reports = await getSavedReports(currentEntityId);
      setSavedReports(reports);
    } catch (error) {
      console.error('Error loading saved reports:', error);
      showToast('Failed to load saved reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyColumns = (newVisibleColumns: string[], newColumnOrder: string[]) => {
    setVisibleColumns(newVisibleColumns);
    setColumnOrder(newColumnOrder);
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      showToast('Please enter a report name', 'error');
      return;
    }

    if (!currentEntityId) {
      showToast('No entity selected', 'error');
      return;
    }

    const existingReport = savedReports.find(
      report => report.report_name.toLowerCase() === reportName.trim().toLowerCase()
    );

    if (existingReport) {
      showToast('A report with this name already exists', 'error');
      return;
    }

    try {
      const newReport = await createSavedReport(
        currentEntityId,
        reportName.trim(),
        visibleColumns,
        columnOrder
      );
      setSavedReports([newReport, ...savedReports]);
      setReportName('');
      setShowSaveModal(false);
      showToast('Report saved successfully', 'success');
    } catch (error) {
      console.error('Error saving report:', error);
      showToast('Failed to save report', 'error');
    }
  };

  const handleSelectReport = (report: SavedReport | null) => {
    setSelectedReport(report);
    setShowReportDropdown(false);

    if (report) {
      setVisibleColumns(report.visible_columns);
      setColumnOrder(report.column_order);
    } else {
      setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
      setColumnOrder(AVAILABLE_COLUMNS.map(col => col.key));
    }
  };

  const handleDeleteReport = async (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteSavedReport(reportId);
      setSavedReports(savedReports.filter(r => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
        setColumnOrder(AVAILABLE_COLUMNS.map(col => col.key));
      }
      showToast('Report deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting report:', error);
      showToast('Failed to delete report', 'error');
    }
  };

  const handleToggleHeader = async () => {
    if (!user || updatingHeader) return;

    const newVisibility = !headerVisible;
    setUpdatingHeader(true);

    try {
      await updateHeaderVisibility(user.id, newVisibility);
      await updateProfile({ header_visible: newVisibility });
      showToast(newVisibility ? 'Header unlocked' : 'Header locked', 'success');
    } catch (error) {
      console.error('Failed to update header visibility:', error);
      showToast('Failed to update preference', 'error');
    } finally {
      setUpdatingHeader(false);
    }
  };

  const prepareExportData = () => {
    const columnLabels = AVAILABLE_COLUMNS.reduce((acc, col) => {
      acc[col.key] = col.label;
      return acc;
    }, {} as Record<string, string>);

    const orderedVisibleColumns = columnOrder.filter(key => visibleColumns.includes(key));
    const dataToExport = filteredReceipts;

    return dataToExport.map(receipt => {
      const row: Record<string, any> = {};
      orderedVisibleColumns.forEach(key => {
        const label = columnLabels[key];
        let value: any;

        switch (key) {
          case 'display_name':
            value = receipt.display_name;
            break;
          case 'user_name':
            value = receipt.user_name || receipt.user_email || 'N/A';
            break;
          case 'vendor':
            value = receipt.vendor || '';
            break;
          case 'amount':
            value = receipt.amount ? `$${receipt.amount.toFixed(2)}` : '';
            break;
          case 'category':
            value = receipt.category || '';
            break;
          case 'status':
            value = receipt.status;
            break;
          case 'billable':
            value = receipt.billable ? 'Yes' : 'No';
            break;
          case 'reimbursable':
            value = receipt.reimbursable ? 'Yes' : 'No';
            break;
          case 'expense_report':
            value = receipt.expense_report || '';
            break;
          case 'due_date':
            value = receipt.due_date ? new Date(receipt.due_date).toLocaleDateString() : '';
            break;
          case 'created_at':
            value = new Date(receipt.created_at).toLocaleDateString();
            break;
          case 'notes':
            value = receipt.notes || '';
            break;
          case 'tags':
            value = receipt.tags?.join(', ') || '';
            break;
          case 'unique_id':
            value = receipt.id;
            break;
          case 'url':
            value = `${window.location.origin}/#/receipts?id=${receipt.id}`;
            break;
          default:
            value = '';
        }

        row[label] = value;
      });
      return row;
    });
  };

  const handleExportCsv = () => {
    if (filteredReceipts.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    try {
      const exportData = prepareExportData();
      let filename = `receipts-${new Date().toISOString().split('T')[0]}`;
      if (fromDate || toDate) {
        const dateRange = [fromDate, toDate].filter(Boolean).join('_to_');
        filename = `receipts-${dateRange}`;
      }
      filename += '.csv';
      exportToCsv(exportData, filename);
      showToast(`CSV exported successfully (${filteredReceipts.length} records)`, 'success');
      setShowExportDropdown(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Failed to export CSV', 'error');
    }
  };

  const handleExportPdf = () => {
    if (filteredReceipts.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    try {
      const exportData = prepareExportData();
      const title = 'Receipt Batch Report';
      let filename = `receipts-${new Date().toISOString().split('T')[0]}`;
      if (fromDate || toDate) {
        const dateRange = [fromDate, toDate].filter(Boolean).join('_to_');
        filename = `receipts-${dateRange}`;
      }
      filename += '.pdf';
      exportToPdf(exportData, title, filename);
      showToast(`PDF exported successfully (${filteredReceipts.length} records)`, 'success');
      setShowExportDropdown(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Failed to export PDF', 'error');
    }
  };

  const handleToggleStatus = (status: ReceiptStatus) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleRowClick = (receipt: Document) => {
    setSelectedDocument(receipt);
    setShowDetailModal(true);
  };

  const handleModalUpdate = async () => {
    await refetchReceipts();
  };

  const grandTotal = useMemo(() => {
    return filteredReceipts.reduce((sum, receipt) => {
      return sum + (receipt.amount || 0);
    }, 0);
  }, [filteredReceipts]);

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) {
      showToast('No receipts selected', 'error');
      return;
    }

    setPendingStatusChange(newStatus);
    setShowConfirmModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    setIsUpdatingStatus(true);

    try {
      const affectedReceipts = filteredReceipts.filter(r => selectedIds.includes(r.id));
      const uniqueReportIds = Array.from(
        new Set(
          affectedReceipts
            .map((r: any) => r.expense_report_id)
            .filter((id: string | undefined): id is string => !!id)
        )
      );

      const result = await bulkUpdateDocumentStatus(selectedIds, pendingStatusChange);

      if (result.error) {
        throw result.error;
      }

      if (uniqueReportIds.length > 0) {
        await Promise.all(uniqueReportIds.map((id: string) => syncExpenseReportStatus(id)));
      }

      if (result.failed > 0) {
        showToast(
          `Status changed for ${result.success} ${result.success === 1 ? 'receipt' : 'receipts'}, ${result.failed} failed`,
          'warning'
        );
      } else {
        showToast(
          `Status changed for ${result.success} ${result.success === 1 ? 'receipt' : 'receipts'}`,
          'success'
        );
      }

      setSelectedIds([]);
      await refetchReceipts();
      setShowConfirmModal(false);
      setPendingStatusChange('');
    } catch (error) {
      console.error('Error updating receipt status:', error);
      showToast('Failed to update receipt status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelStatusChange = () => {
    setShowConfirmModal(false);
    setPendingStatusChange('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader
        pageTitle="Batch View"
        onNavigate={onNavigate}
        currentPage="batch-view"
        headerVisible={headerVisible}
        onBack={() => onNavigate('reports')}
        rightActions={
          <button
            onClick={handleToggleHeader}
            disabled={updatingHeader}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={headerVisible ? 'Lock header' : 'Unlock header'}
          >
            {updatingHeader ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-gray-300"></div>
            ) : headerVisible ? (
              <Unlock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Lock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Batch View</h1>
        </div>

        <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            </div>
            {(['submitted', 'approved', 'flagged', 'batched'] as ReceiptStatus[]).map(status => {
              const isSelected = selectedStatuses.includes(status);
              const color = getReceiptStatusColor(status);
              return (
                <button
                  key={status}
                  onClick={() => handleToggleStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                      : color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-500'
                      : color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-500'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent'
                  }`}
                >
                  {getReceiptStatusLabel(status)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Dates
              </button>
            )}
            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredReceipts.length} of {receipts.length} receipts
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowReportDropdown(!showReportDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span className="text-sm font-medium">
                Saved Reports: {selectedReport ? selectedReport.report_name : 'Default'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showReportDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <button
                    onClick={() => handleSelectReport(null)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm ${
                      !selectedReport ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Default
                  </button>

                  {savedReports.map(report => (
                    <button
                      key={report.id}
                      onClick={() => handleSelectReport(report)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center justify-between group ${
                        selectedReport?.id === report.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{report.report_name}</span>
                      <button
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1"
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Report
          </Button>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {showExportDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <button
                    onClick={handleExportCsv}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export as CSV
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {receiptsLoading || loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {selectedIds.length > 0 && (
              <BulkActionToolbar
                selectedCount={selectedIds.length}
                onClearSelection={() => setSelectedIds([])}
                onStatusChange={handleBulkStatusChange}
              />
            )}

            <ReceiptBatchTable
              receipts={paginatedReceipts}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
              onOpenColumnSelector={() => setShowColumnSelector(true)}
              onNavigate={onNavigate}
              onRowClick={handleRowClick}
              grandTotal={grandTotal}
              totalCount={filteredReceipts.length}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />

            {filteredReceipts.length > 0 && (
              <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredReceipts.length)}-
                      {Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length} results
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showColumnSelector && (
        <ColumnSelector
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onApply={handleApplyColumns}
          onClose={() => setShowColumnSelector(false)}
        />
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Save Report
              </h3>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveReport()}
              />
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setShowSaveModal(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveReport} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <DocumentDetailModal
        document={selectedDocument}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDocument(null);
        }}
        onUpdate={handleModalUpdate}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelStatusChange}
        onConfirm={handleConfirmStatusChange}
        title="Change Receipt Status"
        message={`Are you sure you want to change the status of ${selectedIds.length} ${selectedIds.length === 1 ? 'receipt' : 'receipts'} to ${pendingStatusChange.charAt(0).toUpperCase() + pendingStatusChange.slice(1)}?`}
        confirmText="Change Status"
        cancelText="Cancel"
        variant="default"
        loading={isUpdatingStatus}
      />
    </div>
  );
}
