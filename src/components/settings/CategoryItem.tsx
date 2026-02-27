import { useState, memo } from 'react';
import { Edit2, Archive, Check, X, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category } from '../../lib/categories';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CategoryItemProps {
  category: Category;
  onUpdate: (id: string, name: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export const CategoryItem = memo(function CategoryItem({
  category,
  onUpdate,
  onArchive,
}: CategoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [isLoading, setIsLoading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = async () => {
    if (!editedName.trim() || editedName.trim() === category.name) {
      setIsEditing(false);
      setEditedName(category.name);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(category.id, editedName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedName(category.name);
    setIsEditing(false);
  };

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await onArchive(category.id);
    } catch (error) {
      console.error('Failed to archive category:', error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 ease-out min-h-[60px] ${
        isDragging ? 'shadow-lg opacity-50' : 'shadow-sm'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            autoFocus
            disabled={isLoading}
            className="w-full"
          />
        ) : (
          <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
            {category.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              disabled={isLoading || !editedName.trim()}
              className="p-2 h-auto"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              variant="secondary"
              className="p-2 h-auto"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              variant="secondary"
              className="p-2 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit category"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleArchive}
              disabled={isLoading}
              variant="secondary"
              className="p-2 h-auto opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Archive category"
            >
              <Archive className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
});
