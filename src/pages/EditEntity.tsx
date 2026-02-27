import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { Toggle } from '../components/ui/Toggle';
import { Save, Upload, X } from 'lucide-react';
import { PageType } from '../App';
import { uploadEntityLogo, deleteEntityLogo } from '../lib/entityLogo';

interface EditEntityProps {
  onNavigate: (page: PageType) => void;
}

export default function EditEntity({ onNavigate }: EditEntityProps) {
  const { profile, entity, updateEntityName, updateEntityLogo, updateEntityDefaults } = useAuth();
  useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    entity_name: entity?.entity_name || '',
    show_billable_default: entity?.show_billable_default ?? false,
    show_reimbursable_default: entity?.show_reimbursable_default ?? false,
    show_enter_multiple_default: entity?.show_enter_multiple_default ?? false,
    show_create_reports_default: entity?.show_create_reports_default ?? false,
    upload_multiple_images_default: entity?.upload_multiple_images_default ?? false,
  });

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);

    const [nameResult, defaultsResult] = await Promise.all([
      updateEntityName(formData.entity_name),
      updateEntityDefaults({
        show_billable_default: formData.show_billable_default,
        show_reimbursable_default: formData.show_reimbursable_default,
        show_enter_multiple_default: formData.show_enter_multiple_default,
        show_create_reports_default: formData.show_create_reports_default,
        upload_multiple_images_default: formData.upload_multiple_images_default,
      }),
    ]);

    setLoading(false);

    if (nameResult.error || defaultsResult.error) {
      showToast('Failed to save changes. Please try again.', 'error');
    } else {
      showToast('Entity updated successfully!', 'success');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !entity) return;

    setUploadingLogo(true);

    try {
      const result = await uploadEntityLogo(entity.id, file);
      if (result) {
        await updateEntityLogo(result.url);
        showToast('Logo uploaded successfully!', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!entity) return;

    setUploadingLogo(true);

    try {
      await deleteEntityLogo(entity.id);
      await updateEntityLogo(null);
      showToast('Logo removed successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to remove logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Edit Entity"
        currentPage="edit-entity"
        onNavigate={onNavigate}
        onBack={() => onNavigate('settings')}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-6 mb-4 border bg-white border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  Entity Logo
                </label>
                <div className="flex items-center gap-4">
                  {entity?.entity_logo_url ? (
                    <img
                      src={entity.entity_logo_url}
                      alt="Entity logo"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-2xl">
                      {entity?.entity_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                    {entity?.entity_logo_url && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-xs mt-2 ${
                  'text-gray-500'
                }`}>
                  Upload a PNG, JPG, or WebP image. Max size: 5MB
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  Entity ID
                </label>
                <input
                  type="text"
                  value={entity?.entity_id || 'Loading...'}
                  disabled
                  className={`w-full px-4 py-3 rounded-xl cursor-not-allowed ${
                    'bg-gray-100 border border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                />
                <p className={`text-xs mt-1 ${
                  'text-gray-500'
                }`}>Your permanent entity ID</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  Entity Name
                </label>
                <input
                  type="text"
                  value={formData.entity_name}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setFormData({ ...formData, entity_name: e.target.value });
                    }
                  }}
                  maxLength={100}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500'
                  }`}
                  placeholder="Enter entity name"
                />
                <p className={`text-xs mt-1 ${
                  'text-gray-500'
                }`}>
                  {formData.entity_name.length}/100 characters
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-6 mb-4 border bg-white border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">Default Settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configure default values for new receipts across your entire entity</p>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Billable</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Show Billable flag on receipts and default new receipts to billable</p>
                </div>
                <Toggle
                  enabled={formData.show_billable_default}
                  onChange={() => setFormData({ ...formData, show_billable_default: !formData.show_billable_default })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reimbursable</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Show Reimbursable flag on receipts and default new receipts to reimbursable</p>
                </div>
                <Toggle
                  enabled={formData.show_reimbursable_default}
                  onChange={() => setFormData({ ...formData, show_reimbursable_default: !formData.show_reimbursable_default })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Show Enter Multiple</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enable bulk entry mode for multiple receipts</p>
                </div>
                <Toggle
                  enabled={formData.show_enter_multiple_default}
                  onChange={() => setFormData({ ...formData, show_enter_multiple_default: !formData.show_enter_multiple_default })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Create Expense Reports</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Turn Expense Reports Option On</p>
                </div>
                <Toggle
                  enabled={formData.show_create_reports_default}
                  onChange={() => setFormData({ ...formData, show_create_reports_default: !formData.show_create_reports_default })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Upload Multiple Images</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enable uploading multiple images at once</p>
                </div>
                <Toggle
                  enabled={formData.upload_multiple_images_default}
                  onChange={() => setFormData({ ...formData, upload_multiple_images_default: !formData.upload_multiple_images_default })}
                />
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
