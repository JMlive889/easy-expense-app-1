import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserEntityMemberships, EntityMembership } from '../../lib/entities';
import { getCurrentEntity } from '../../lib/profiles';
import { Building2, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function EntitySelector() {
  const { user, switchEntity } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [entities, setEntities] = useState<EntityMembership[]>([]);
  const [currentEntityId, setCurrentEntityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntities();
  }, [user]);

  const loadEntities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [memberships, savedEntityId] = await Promise.all([
        getUserEntityMemberships(user.id),
        getCurrentEntity(user.id),
      ]);

      setEntities(memberships);
      setCurrentEntityId(savedEntityId);

      if (!savedEntityId && memberships.length > 0) {
        const firstEntity = memberships[0].entity_id;
        await switchEntity(firstEntity);
        setCurrentEntityId(firstEntity);
      }
    } catch (error) {
      console.error('Error loading entities:', error);
      showToast('Failed to load entities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntity = async (entityId: string) => {
    if (!user) return;

    try {
      const { error } = await switchEntity(entityId);
      if (error) throw error;
      setCurrentEntityId(entityId);
      showToast('Entity selected successfully', 'success');
    } catch (error) {
      console.error('Error selecting entity:', error);
      showToast('Failed to select entity', 'error');
    }
  };

  if (loading) {
    return null;
  }

  if (entities.length === 0) {
    return null;
  }

  if (entities.length === 1) {
    return null;
  }

  return (
    <div className={`rounded-3xl p-6 mb-4 border ${
      theme === 'dark'
        ? 'bg-gray-900 border-gray-800'
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <Building2 className={`w-5 h-5 ${
          theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
        }`} />
        <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
          Select Entity
        </h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Choose which entity you want to view and manage
      </p>

      <div className="space-y-2">
        {entities.map((membership) => {
          const entity = membership.entity;
          if (!entity) return null;

          const isSelected = currentEntityId === membership.entity_id;

          return (
            <button
              key={membership.id}
              onClick={() => handleSelectEntity(membership.entity_id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? theme === 'dark'
                    ? 'bg-emerald-500/10 border-emerald-500'
                    : 'bg-emerald-50 border-emerald-500'
                  : theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-emerald-500/50'
                  : 'bg-gray-50 border-gray-200 hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {entity.entity_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {entity.entity_id}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 capitalize">
                    {membership.role}
                  </div>
                </div>
                {isSelected && (
                  <Check className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                  }`} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
