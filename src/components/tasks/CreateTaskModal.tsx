import { useState } from 'react';
import { X } from 'lucide-react';
import { TaskCategory } from '../../contexts/TaskContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { createTodo } from '../../lib/todos';
import { useToast } from '../../contexts/ToastContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: TaskCategory;
  onSuccess?: () => void;
}

const categoryOptions: { value: TaskCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'docs', label: 'Docs' },
  { value: 'messages', label: 'Messages' },
  { value: 'receipts', label: 'Receipts' },
];

export default function CreateTaskModal({ isOpen, onClose, defaultCategory = 'general', onSuccess }: CreateTaskModalProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<TaskCategory>(defaultCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    const { error } = await createTodo({
      content,
      category,
    });

    if (error) {
      showToast('Failed to create task', 'error');
    } else {
      showToast('Task created successfully', 'success');
      setContent('');
      setCategory(defaultCategory);
      onClose();
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="task-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task
            </label>
            <Input
              id="task-content"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
