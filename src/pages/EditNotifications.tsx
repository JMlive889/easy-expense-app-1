import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { Toggle } from '../components/ui/Toggle';
import { Save, Bell } from 'lucide-react';
import { PageType } from '../App';

interface EditNotificationsProps {
  onNavigate: (page: PageType) => void;
}

export default function EditNotifications({ onNavigate }: EditNotificationsProps) {
  const { profile, updateProfile } = useAuth();
  const { theme } = useTheme()
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    push_notifications: profile?.push_notifications ?? false,
    email_notifications: profile?.email_notifications ?? true,
  });

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);

    const result = await updateProfile({
      push_notifications: formData.push_notifications,
      email_notifications: formData.email_notifications,
    });

    setLoading(false);

    if (result.error) {
      showToast('Failed to save notification preferences. Please try again.', 'error');
    } else {
      showToast('Notification preferences saved!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Notifications"
        currentPage="edit-notifications"
        onNavigate={onNavigate}
        onBack={() => onNavigate('settings')}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-sm rounded-3xl p-6 mb-4 border bg-white border-gray-200 shadow-sm dark:bg-black/40 dark:border-emerald-500/30">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex-shrink-0">
                    <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications on your device</p>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-2">
                  <Toggle
                    enabled={formData.push_notifications}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        push_notifications: !formData.push_notifications,
                      })
                    }
                  />
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-emerald-500/20" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex-shrink-0">
                    <Bell className={`w-5 h-5 ${
                      theme === 'dark' ? 'text-teal-400' : 'text-teal-600'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium ${
                      'text-slate-900 dark:text-white'
                    }`}>Email Notifications</p>
                    <p className={`text-sm ${
                      'text-gray-600 dark:text-gray-400'
                    }`}>Receive email alerts and updates</p>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-2">
                  <Toggle
                    enabled={formData.email_notifications}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        email_notifications: !formData.email_notifications,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 ${
            theme === 'dark'
              ? 'bg-teal-500/10 border border-teal-500/30'
              : 'bg-teal-50 border border-teal-200'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-teal-300' : 'text-teal-700'
            }`}>
              You can change these settings at any time. Notifications help you stay updated with important events and activities.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
