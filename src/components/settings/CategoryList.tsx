import { Plus, Inbox } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Category } from '../../lib/categories';
import { CategoryItem } from './CategoryItem';

interface CategoryListProps {
  categories: Category[];
  onUpdate: (id: string, name: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onReorder: (categoryIds: string[]) => Promise<void>;
  onOptimisticReorder: (reorderedCategories: Category[]) => void;
  onAddClick: () => void;
  title: string;
}

export function CategoryList({
  categories,
  onUpdate,
  onArchive,
  onReorder,
  onOptimisticReorder,
  onAddClick,
  title,
}: CategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      onOptimisticReorder(reorderedCategories);

      const categoryIds = reorderedCategories.map((c) => c.id);
      onReorder(categoryIds);
    }
  };

  const categoryIds = categories.map((c) => c.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <button
          onClick={onAddClick}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm hover:shadow-md"
          title="Add Category"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
            No categories yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Create your first category to get started
          </p>
          <button
            onClick={onAddClick}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm hover:shadow-md"
            title="Add Category"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onUpdate={onUpdate}
                  onArchive={onArchive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
