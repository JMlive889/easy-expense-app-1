import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext';
import { RoleDisplay } from '../lib/supabase';
import { AppHeader } from '../components/AppHeader';
import Avatar from '../components/Avatar';
import EntitySelector from '../components/settings/EntitySelector';
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  CreditCard,
  FileKey,
  Calculator,
  Building2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { PageType } from '../App';

interface SettingsProps {
  onNavigate: (page: PageType) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const { profile } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Settings"
        currentPage="settings"
        onNavigate={onNavigate}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="p-6 pb-8 lg:pb-8">
        <div className="max-w-4xl mx-auto">
        <EntitySelector />

        <button
          onClick={() => onNavigate('edit-profile')}
          className={`w-full rounded-3xl p-6 mb-4 border  text-left ${
            theme === 'dark'
              ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/50'
              : 'bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="md" />
              <div>
                <h2 className={`font-semibold text-lg ${
                  'text-slate-900 dark:text-white'
                }`}>User Settings</h2>
                <p className={`text-sm mt-1 ${
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {profile?.full_name || 'Update your profile information'}
                </p>
                {profile?.role && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      RoleDisplay[profile.role].bgColor
                    } ${RoleDisplay[profile.role].color}`}>
                      {RoleDisplay[profile.role].label}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
        </button>

        {profile?.role === 'owner' && (
          <button
            onClick={() => onNavigate('edit-entity')}
            className={`w-full rounded-3xl p-6 mb-4 border  text-left ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/50'
                : 'bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                }`} />
                <div>
                  <h2 className={`font-semibold text-lg ${
                    'text-slate-900 dark:text-white'
                  }`}>Entity</h2>
                  <p className={`text-sm mt-1 ${
                    'text-gray-600 dark:text-gray-400'
                  }`}>Manage your entity information</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </button>
        )}

        <button
          onClick={() => onNavigate('edit-notifications')}
          className={`w-full rounded-3xl p-6 mb-4 border  text-left ${
            theme === 'dark'
              ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/50'
              : 'bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className={`w-5 h-5 ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
              }`} />
              <div>
                <h2 className={`font-semibold text-lg ${
                  'text-slate-900 dark:text-white'
                }`}>Notifications</h2>
                <p className={`text-sm mt-1 ${
                  'text-gray-600 dark:text-gray-400'
                }`}>Manage notification preferences</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
        </button>

        {profile?.role === 'owner' && (
          <>
            <button
              onClick={() => onNavigate('other-settings')}
              className={`w-full rounded-3xl p-6 mb-4 border  text-left ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/50'
                  : 'bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SettingsIcon className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                  }`} />
                  <div>
                    <h2 className={`font-semibold text-lg ${
                      'text-slate-900 dark:text-white'
                    }`}>Other Settings</h2>
                    <p className={`text-sm mt-1 ${
                      'text-gray-600 dark:text-gray-400'
                    }`}>Manage your custom categories</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </button>

            <button
              onClick={() => onNavigate('pricing')}
              className={`w-full rounded-3xl p-6 mb-4 border  text-left ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/50'
                  : 'bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                  }`} />
                  <div>
                    <h2 className={`font-semibold text-lg ${
                      'text-slate-900 dark:text-white'
                    }`}>Subscription</h2>
                    <p className={`text-sm mt-1 ${
                      'text-gray-600 dark:text-gray-400'
                    }`}>Manage your subscription plan</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </button>

            <button
              onClick={() => onNavigate('licenses')}
              className={`w-full rounded-3xl p-6 mb-4 border  text-left ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/50'
                  : 'bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileKey className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                  }`} />
                  <div>
                    <h2 className={`font-semibold text-lg ${
                      'text-slate-900 dark:text-white'
                    }`}>Licenses</h2>
                    <p className={`text-sm mt-1 ${
                      'text-gray-600 dark:text-gray-400'
                    }`}>Manage team member licenses</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </button>

            <button
              onClick={() => onNavigate('add-accountant')}
              className={`w-full rounded-3xl p-6 mb-4 border  text-left ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/50'
                  : 'bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                  }`} />
                  <div>
                    <h2 className={`font-semibold text-lg ${
                      'text-slate-900 dark:text-white'
                    }`}>Accountant</h2>
                    <p className={`text-sm mt-1 ${
                      'text-gray-600 dark:text-gray-400'
                    }`}>Add your accountant's access</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </button>

            <div className={`rounded-3xl p-6 mb-4 border opacity-50 ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                }`} />
                <h2 className={`font-semibold text-lg ${
                  'text-slate-900 dark:text-white'
                }`}>Bank Connections</h2>
              </div>
              <p className={`text-sm ${'text-gray-600 dark:text-gray-400'}`}>
                Coming soon
              </p>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
