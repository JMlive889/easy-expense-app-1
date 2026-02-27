import React, { useEffect, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { PageType } from '../App'
import { CheckCircle2, FileCheck, AlertCircle, Package, ShieldAlert, Lock, Unlock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useRBAC } from '../hooks/useRBAC'
import { getReceiptStatusCounts, ReceiptStatusCounts } from '../lib/receiptStatus'
import { CategoryPieChart } from '../components/analytics/CategoryPieChart'
import { SpendingTrendsChart } from '../components/analytics/SpendingTrendsChart'
import { UserSpendingChart } from '../components/analytics/UserSpendingChart'
import { updateHeaderVisibility } from '../lib/profiles'

interface ReportsProps {
  onNavigate: (page: PageType) => void
}

export function Reports({ onNavigate }: ReportsProps) {
  const { user, profile, updateProfile } = useAuth();
  const { permissions, loading: rbacLoading, isGuest, isOwner, isAccountant } = useRBAC();
  const { showToast } = useToast();
  const [statusCounts, setStatusCounts] = useState<ReceiptStatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingHeader, setUpdatingHeader] = useState(false);
  const headerVisible = profile?.header_visible ?? true;

  useEffect(() => {
    loadStatusCounts();
  }, []);

  const loadStatusCounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await getReceiptStatusCounts();
      if (error) {
        console.error('Failed to load status counts:', error);
        showToast('Failed to load receipt counts', 'error');
      } else {
        setStatusCounts(data);
      }
    } catch (error) {
      console.error('Unexpected error loading status counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchView = () => {
    onNavigate('batch-view');
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

  if (!rbacLoading && !permissions.canViewReports) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You do not have permission to view this page. Please contact your account owner if you need access to reports.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppHeader
        pageTitle="Reports"
        currentPage="reports"
        onNavigate={onNavigate}
        showBackButton={false}
        headerVisible={headerVisible}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-8 lg:pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Submitted</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {statusCounts?.submitted || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Approved</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {statusCounts?.approved || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Flagged</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {statusCounts?.flagged || 0}
              </p>
            </div>

            {(isOwner || isAccountant) && (
              <button
                onClick={handleBatchView}
                className="hidden md:flex flex-col items-start justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-sm p-6 transition-all hover:shadow-lg active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Batch View</h3>
                </div>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CategoryPieChart />
          <SpendingTrendsChart />
          <UserSpendingChart />
        </div>
      </main>
    </div>
  )
}
