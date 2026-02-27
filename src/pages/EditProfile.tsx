import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { RoleDisplay } from '../lib/supabase';
import Avatar from '../components/Avatar';
import { AppHeader } from '../components/AppHeader';
import { Toggle } from '../components/ui/Toggle';
import { Camera, Save, Sun, Moon } from 'lucide-react';
import { PageType } from '../App';

interface EditProfileProps {
  onNavigate: (page: PageType) => void;
}

export default function EditProfile({ onNavigate }: EditProfileProps) {
  const { profile, updateProfile } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    avatar_url: profile?.avatar_url || '',
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);

    const profileResult = await updateProfile({
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      avatar_url: formData.avatar_url,
    });

    setLoading(false);

    if (profileResult.error) {
      showToast('Failed to save changes. Please try again.', 'error');
    } else {
      if (formData.full_name && formData.full_name.trim() !== '') {
        localStorage.removeItem('profileBannerDismissed');
      }
      showToast('Profile updated successfully!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="User Settings"
        currentPage="edit-profile"
        onNavigate={onNavigate}
        onBack={() => onNavigate('settings')}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-6 mb-4 border bg-white border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div
                    onClick={handleImageClick}
                    className="cursor-pointer hover:opacity-80"
                  >
                    <div className="w-24 h-24">
                      <Avatar name={formData.full_name} avatarUrl={formData.avatar_url} size="lg" />
                    </div>
                  </div>
                  <button
                    onClick={handleImageClick}
                    className="absolute bottom-0 right-0 p-2 rounded-full border-2 bg-emerald-500 border-white hover:bg-emerald-600 dark:bg-emerald-600 dark:border-slate-900 dark:hover:bg-emerald-700"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500'
                  }`}
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500'
                  }`}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className={`w-full px-4 py-3 rounded-xl cursor-not-allowed ${
                    'bg-gray-100 border border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                />
                <p className={`text-xs mt-1 ${
                  'text-gray-500'
                }`}>Email cannot be changed</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  Role
                </label>
                <div className={`w-full px-4 py-3 rounded-xl ${
                  'bg-gray-100 border border-gray-200 dark:bg-black/30 dark:border-emerald-500/30'
                }`}>
                  {profile?.role && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                      RoleDisplay[profile.role].bgColor
                    } ${RoleDisplay[profile.role].color}`}>
                      {RoleDisplay[profile.role].label}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  'text-gray-500'
                }`}>Role is managed by administrators</p>
              </div>

              <div className={`pt-4 border-t ${
                'border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`block text-sm font-medium ${
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      Theme
                    </label>
                    <p className={`text-xs mt-1 ${
                      'text-gray-500'
                    }`}>
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </p>
                  </div>
                  <Toggle
                    enabled={theme === 'dark'}
                    onChange={toggleTheme}
                    enabledIcon={Moon}
                    disabledIcon={Sun}
                  />
                </div>
              </div>
            </div>
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
