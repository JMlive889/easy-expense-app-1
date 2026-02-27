import { useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface InviteLicenseFormProps {
  licenseType: 'admin' | 'guest';
  availableCount: number;
  onInvite: (email: string, licenseType: 'admin' | 'guest') => Promise<boolean>;
}

export function InviteLicenseForm({ licenseType, availableCount, onInvite }: InviteLicenseFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    setLoading(true);
    const success = await onInvite(email.trim().toLowerCase(), licenseType);
    if (success) {
      setEmail('');
    }
    setLoading(false);
  };

  const isDisabled = availableCount === 0;

  return (
    <form onSubmit={handleSubmit} className="rounded-lg p-4 border bg-gray-50 border-gray-200 dark:bg-black/40 dark:backdrop-blur-sm dark:border-emerald-500/30">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h3 className="font-medium text-gray-900 dark:text-white">
          Invite {licenseType === 'admin' ? 'Accountant' : 'Guest'}
        </h3>
        <span className={`ml-auto text-sm ${availableCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {availableCount} available
        </span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isDisabled || loading}
            required
            icon={<Mail className="w-5 h-5" />}
          />
        </div>
        <Button
          type="submit"
          disabled={isDisabled || loading || !email.trim()}
          variant="primary"
        >
          {loading ? 'Sending...' : 'Invite'}
        </Button>
      </div>

      {isDisabled && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          No {licenseType === 'admin' ? 'accountant' : 'guest'} licenses available. Upgrade your subscription to add more.
        </p>
      )}
    </form>
  );
}
