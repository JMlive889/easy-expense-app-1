import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Settings, CreditCard, Loader2 } from 'lucide-react';
import { useBillingPortal } from '../hooks/useBillingPortal';

export default function QuickActions() {
  const { showToast } = useToast();
  const { openBillingPortal, loading, error } = useBillingPortal();

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const actions = [
    {
      icon: Settings,
      label: 'Account Settings',
      description: 'Manage your profile and preferences',
      onClick: openBillingPortal,
    },
    {
      icon: CreditCard,
      label: 'Billing History',
      description: 'View your past transactions',
      onClick: openBillingPortal,
    },
  ];

  return (
    <div className="rounded-2xl p-6 bg-white border border-gray-200 dark:bg-black/40 dark:border-emerald-500/30">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={loading}
            className={`flex items-start gap-4 p-4 rounded-xl transition-all text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <action.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                {action.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
