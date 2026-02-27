import { useEffect, useState } from 'react';
import { UserPlus, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { PageType } from '../App';

interface AcceptInvitationProps {
  invitationToken: string;
  onNavigate: (page: PageType) => void;
}

interface LicenseInvitation {
  id: string;
  invited_email: string;
  license_type: 'admin' | 'guest';
  status: 'invited' | 'active' | 'archived';
  entity_name?: string;
  owner_name?: string;
}

export function AcceptInvitation({ invitationToken, onNavigate }: AcceptInvitationProps) {
  const [loading, setLoading] = useState(true);
  const [license, setLicense] = useState<LicenseInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInvitation();
  }, [invitationToken]);

  async function validateInvitation() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('licenses')
        .select(`
          id,
          invited_email,
          license_type,
          status,
          entities!inner(entity_name),
          profiles!owner_id(full_name)
        `)
        .eq('invitation_token', invitationToken)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Invalid or expired invitation link');
        return;
      }

      if (data.status === 'archived') {
        setError('This invitation has been archived');
        return;
      }

      if (data.status === 'active') {
        setError('This invitation has already been accepted');
        return;
      }

      const licenseData: LicenseInvitation = {
        id: data.id,
        invited_email: data.invited_email,
        license_type: data.license_type,
        status: data.status,
        entity_name: (data.entities as any)?.entity_name,
        owner_name: (data.profiles as any)?.full_name
      };

      setLicense(licenseData);
    } catch (err) {
      console.error('Error validating invitation:', err);
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = () => {
    const params = new URLSearchParams();
    params.set('email', license?.invited_email || '');
    params.set('invite_token', invitationToken);
    if (license?.entity_name) {
      params.set('entity_name', license.entity_name);
    }
    if (license?.owner_name) {
      params.set('owner_name', license.owner_name);
    }
    window.location.href = `/?page=signup&${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error || 'This invitation link is not valid'}</p>
          <Button
            variant="primary"
            onClick={() => onNavigate('login')}
            className="w-full"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-blue-600" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
          You're Invited!
        </h2>
        <p className="text-gray-600 text-center mb-8">
          {license.owner_name && license.entity_name ? (
            <>
              <span className="font-semibold">{license.owner_name}</span> has invited you to join{' '}
              <span className="font-semibold">{license.entity_name}</span> as a{' '}
              <span className="font-semibold">
                {license.license_type === 'admin' ? 'Admin' : 'Guest'}
              </span>
            </>
          ) : (
            <>
              You've been invited to join as a{' '}
              <span className="font-semibold">
                {license.license_type === 'admin' ? 'Admin' : 'Guest'}
              </span>
            </>
          )}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900">{license.invited_email}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 mb-1">What's next?</p>
              <p className="text-sm text-gray-600">
                Create your account to accept this invitation and get started. You'll need to set
                up a password for your account.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleAccept}
          className="w-full"
        >
          Accept Invitation & Create Account
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
