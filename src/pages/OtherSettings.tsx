import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { PageType } from '../App';
import { AppHeader } from '../components/AppHeader';
import { CategoryList } from '../components/settings/CategoryList';
import { AddCategoryModal } from '../components/settings/AddCategoryModal';
import { ArchivedCategoriesSection } from '../components/settings/ArchivedCategoriesSection';
import {
  Category,
  getCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  unarchiveCategory,
  reorderCategories,
} from '../lib/categories';

interface OtherSettingsProps {
  onNavigate: (page: PageType) => void;
}

export default function OtherSettings({ onNavigate }: OtherSettingsProps) {
  const { profile, user, entity } = useAuth();
  const { theme } = useTheme()
  const { showToast } = useToast();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const [documentCategories, setDocumentCategories] = useState<Category[]>([]);
  const [receiptCategories, setReceiptCategories] = useState<Category[]>([]);
  const [archivedDocumentCategories, setArchivedDocumentCategories] = useState<Category[]>([]);
  const [archivedReceiptCategories, setArchivedReceiptCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'document' | 'receipt'>('document');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permissionsLoading) return;

    const isOwner = profile?.role === 'owner';
    const canManage = hasPermission('can_manage_categories');

    if (!isOwner && !canManage) {
      showToast('You do not have permission to access this page', 'error');
      onNavigate('settings');
      return;
    }

    if (!profile?.current_entity_id) {
      showToast('No entity selected', 'error');
      onNavigate('settings');
      return;
    }

    loadCategories();
  }, [profile, permissionsLoading]);

  const loadCategories = async () => {
    if (!profile?.current_entity_id) return;

    try {
      setLoading(true);

      const [activeDocuments, activeReceipts, archivedDocuments, archivedReceipts] = await Promise.all([
        getCategories(profile.current_entity_id, 'document', false),
        getCategories(profile.current_entity_id, 'receipt', false),
        getCategories(profile.current_entity_id, 'document', true).then(cats => cats.filter(c => c.is_archived)),
        getCategories(profile.current_entity_id, 'receipt', true).then(cats => cats.filter(c => c.is_archived)),
      ]);

      setDocumentCategories(activeDocuments);
      setReceiptCategories(activeReceipts);
      setArchivedDocumentCategories(archivedDocuments);
      setArchivedReceiptCategories(archivedReceipts);
    } catch (error) {
      console.error('Failed to load categories:', error);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!profile?.current_entity_id || !user) return;

    try {
      await createCategory(profile.current_entity_id, name, addModalType, user.id);
      showToast('Category created successfully', 'success');
      await loadCategories();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      await updateCategory(id, name);
      showToast('Category updated successfully', 'success');
      await loadCategories();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update category', 'error');
      throw error;
    }
  };

  const handleArchiveCategory = async (id: string) => {
    try {
      await archiveCategory(id);
      showToast('Category archived successfully', 'success');
      await loadCategories();
    } catch (error) {
      showToast('Failed to archive category', 'error');
      throw error;
    }
  };

  const handleUnarchiveCategory = async (id: string) => {
    try {
      await unarchiveCategory(id);
      showToast('Category restored successfully', 'success');
      await loadCategories();
    } catch (error) {
      showToast('Failed to restore category', 'error');
      throw error;
    }
  };

  const handleReorderCategories = async (categoryIds: string[]) => {
    try {
      await reorderCategories(categoryIds);
    } catch (error) {
      console.error('Failed to reorder categories:', error);
      showToast('Failed to reorder categories', 'error');
      await loadCategories();
    }
  };

  const handleOptimisticReorderDocuments = (reorderedCategories: Category[]) => {
    setDocumentCategories(reorderedCategories);
  };

  const handleOptimisticReorderReceipts = (reorderedCategories: Category[]) => {
    setReceiptCategories(reorderedCategories);
  };

  const openAddModal = (type: 'document' | 'receipt') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Other Settings"
        currentPage="other-settings"
        onNavigate={onNavigate}
        onBack={() => onNavigate('settings')}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="p-6 pb-8 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={`mt-4 ${'text-gray-600 dark:text-gray-400'}`}>
                Loading categories...
              </p>
            </div>
          ) : (
            <>
              <div className={`backdrop-blur-sm rounded-3xl p-6 mb-6 border ${
                theme === 'dark'
                  ? 'bg-black/40 border-emerald-500/30'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="space-y-8">
                  <CategoryList
                    categories={documentCategories}
                    onUpdate={handleUpdateCategory}
                    onArchive={handleArchiveCategory}
                    onReorder={handleReorderCategories}
                    onOptimisticReorder={handleOptimisticReorderDocuments}
                    onAddClick={() => openAddModal('document')}
                    title="Document Categories"
                  />

                  {archivedDocumentCategories.length > 0 && (
                    <ArchivedCategoriesSection
                      archivedCategories={archivedDocumentCategories}
                      onRestore={handleUnarchiveCategory}
                    />
                  )}
                </div>
              </div>

              <div className={`backdrop-blur-sm rounded-3xl p-6 mb-6 border ${
                theme === 'dark'
                  ? 'bg-black/40 border-emerald-500/30'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <CategoryList
                  categories={receiptCategories}
                  onUpdate={handleUpdateCategory}
                  onArchive={handleArchiveCategory}
                  onReorder={handleReorderCategories}
                  onOptimisticReorder={handleOptimisticReorderReceipts}
                  onAddClick={() => openAddModal('receipt')}
                  title="Receipt Categories"
                />

                {archivedReceiptCategories.length > 0 && (
                  <ArchivedCategoriesSection
                    archivedCategories={archivedReceiptCategories}
                    onRestore={handleUnarchiveCategory}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCategory}
        type={addModalType}
      />
    </div>
  );
}
