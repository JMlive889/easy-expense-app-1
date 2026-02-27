import { useState } from 'react';
import { AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useLicenses } from '../hooks/useLicenses';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getLicenseLimitsByProductName } from '../stripe-config';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AppHeader } from '../components/AppHeader';
import { PageType } from '../App';
import { BookkeeperInquiryModal } from '../components/accountant/BookkeeperInquiryModal';
import { createBookkeeperInquiry, sendBookkeeperInquiryEmail } from '../lib/bookkeeper';

interface AddAccountantProps {
  onNavigate: (page: PageType) => void;
}

export default function AddAccountant({ onNavigate }: AddAccountantProps) {
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { licenses, usage, loading: licensesLoading, inviteUser } = useLicenses();
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isBookkeeperModalOpen, setIsBookkeeperModalOpen] = useState(false);

  const productName = subscription?.product_name || 'Basic';
  const limits = getLicenseLimitsByProductName(productName);
  const accountantLicense = licenses.find(l => l.license_type === 'admin');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    const success = await inviteUser(email.trim().toLowerCase(), 'admin');
    setIsSubmitting(false);

    if (success) {
      setEmail('');
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}?invite=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleBookkeeperInquiry = async (message: string) => {
    try {
      const inquiry = await createBookkeeperInquiry({ message });
      await sendBookkeeperInquiryEmail(inquiry.id);

      const userEmail = profile?.email || 'your registered email';
      showToast(`Request sent! Check your inbox at ${userEmail}`, 'success');
    } catch (error) {
      console.error('Error sending bookkeeper inquiry:', error);
      showToast('Failed to send inquiry. Please try again.', 'error');
      throw error;
    }
  };

  if (subscriptionLoading || licensesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-blue-600 dark:border-emerald-500"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const hasNoLicenses = !limits || limits.adminLicenses === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Add Accountant"
        currentPage="add-accountant"
        onNavigate={onNavigate}
        onBack={() => onNavigate('settings')}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="py-12 px-4 sm:px-6 lg:px-8 pb-8 lg:pb-8">
        <div className="max-w-2xl mx-auto">
          {hasNoLicenses ? (
            <div className={`rounded-lg shadow-sm p-8 text-center border ${
              theme === 'dark' ? 'bg-black/40 backdrop-blur-sm border-emerald-500/30' : 'bg-white border-gray-200'
            }`}>
              <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <h2 className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Upgrade Required</h2>
              <p className={`mb-6 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Your current {productName} plan does not include admin licenses for accountants.
                Upgrade to Premium or Reserve to add an accountant.
              </p>
              <Button
                variant="primary"
                onClick={() => onNavigate('pricing')}
              >
                View Pricing Plans
              </Button>
            </div>
          ) : (
            <>
              <div className={`rounded-lg shadow-sm p-6 mb-6 border ${
                theme === 'dark' ? 'bg-black/40 backdrop-blur-sm border-emerald-500/30' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Accountant Permissions</h2>
                <p className={`text-sm mb-4 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Your accountant will have viewing access to help manage your finances, but certain critical actions remain exclusively under your control.
                </p>

                <div className="space-y-2">
                  <div className={`text-sm ${'text-gray-600 dark:text-gray-400'}`}>
                    <span className="font-medium">Your accountant can:</span>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                      <li>View financial data and reports</li>
                      <li>Access connected bank account information</li>
                      <li>Help manage transactions and receipts</li>
                    </ul>
                  </div>

                  <div className={`text-sm ${'text-gray-600 dark:text-gray-400'} pt-2`}>
                    <span className="font-medium">Your accountant cannot:</span>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                      <li>Change your entity information</li>
                      <li>Update your subscription or billing settings</li>
                      <li>Add or delete bank account connections</li>
                    </ul>
                  </div>
                </div>
              </div>

              {accountantLicense ? (
                <div className={`rounded-lg shadow-sm p-6 border ${
                  theme === 'dark' ? 'bg-black/40 backdrop-blur-sm border-emerald-500/30' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`w-6 h-6 ${
                        accountantLicense.status === 'active'
                          ? 'text-green-500'
                          : theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
                      }`} />
                      <div>
                        <h3 className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{accountantLicense.invited_email}</h3>
                        <p className={`text-sm ${
                          'text-gray-600 dark:text-gray-400'
                        }`}>Admin License</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      accountantLicense.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : accountantLicense.status === 'invited'
                        ? theme === 'dark'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {accountantLicense.status === 'active' ? 'Active' :
                       accountantLicense.status === 'invited' ? 'Pending' : 'Archived'}
                    </span>
                  </div>

                  {accountantLicense.status === 'invited' && (
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className={`text-sm mb-2 ${
                        'text-gray-700 dark:text-gray-300'
                      }`}>Share this invitation link with your accountant:</p>
                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}?invite=${accountantLicense.invitation_token}`}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => copyInvitationLink(accountantLicense.invitation_token)}
                        >
                          {copiedToken === accountantLicense.invitation_token ? (
                            'Copied!'
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : usage.active_admin_count >= limits.adminLicenses ? (
                <div className={`rounded-lg shadow-sm p-8 text-center border ${
                  theme === 'dark' ? 'bg-black/40 backdrop-blur-sm border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
                  }`} />
                  <h2 className={`text-xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>All Admin Licenses In Use</h2>
                  <p className={`mb-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    You're currently using all {limits.adminLicenses} admin license{limits.adminLicenses > 1 ? 's' : ''} from your {productName} plan.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => onNavigate('licenses')}
                  >
                    Manage Licenses
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className={`rounded-lg shadow-sm p-6 border ${
                  theme === 'dark' ? 'bg-black/40 backdrop-blur-sm border-emerald-500/30' : 'bg-white border-gray-200'
                }`}>
                  <h2 className={`text-lg font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Invite Your Accountant</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="accountant-email" className={`block text-sm font-medium mb-2 ${
                        'text-gray-700 dark:text-gray-300'
                      }`}>
                        Accountant's Email Address
                      </label>
                      <Input
                        id="accountant-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="accountant@example.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting || !email.trim()}
                      className="w-full"
                    >
                      {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-800">
            <div className="mb-6">
              <h2 className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Don't have an Accountant?</h2>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                Let Easy Expense App handle your bookkeeping needs. Our professional bookkeeping team can help manage your financial records, organize your expenses, and keep your books in order.
              </p>
            </div>

            <div className={`rounded-lg shadow-sm p-6 border ${
              theme === 'dark' ? 'bg-black/40 backdrop-blur-sm border-emerald-500/30' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Let's Meet</h3>
              <p className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Need help with your books? We specialize in good, clean, accurate, hassle-free bookkeeping.
              </p>
              <Button
                variant="primary"
                onClick={() => setIsBookkeeperModalOpen(true)}
                className="w-full py-3 text-base"
              >
                Request an Accountant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BookkeeperInquiryModal
        isOpen={isBookkeeperModalOpen}
        onClose={() => setIsBookkeeperModalOpen(false)}
        onSubmit={handleBookkeeperInquiry}
      />
    </div>
  );
}
