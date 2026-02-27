import { useState } from 'react';
import { ChevronDown, ChevronUp, ArchiveRestore, Archive } from 'lucide-react';
import { Category } from '../../lib/categories';
import { Button } from '../ui/Button';

interface ArchivedCategoriesSectionProps {
  archivedCategories: Category[];
  onRestore: (id: string) => Promise<void>;
}

export function ArchivedCategoriesSection({
  archivedCategories,
  onRestore,
}: ArchivedCategoriesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await onRestore(id);
    } catch (error) {
      console.error('Failed to restore category:', error);
    } finally {
      setRestoringId(null);
    }
  };

  if (archivedCategories.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Archived Categories ({archivedCategories.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {archivedCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {category.name}
                </span>
              </div>
              <Button
                onClick={() => handleRestore(category.id)}
                disabled={restoringId === category.id}
                variant="secondary"
                className="flex items-center gap-2 text-sm"
                title="Restore category"
              >
                <ArchiveRestore className="w-4 h-4" />
                {restoringId === category.id ? 'Restoring...' : 'Restore'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
