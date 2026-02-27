import { Check } from 'lucide-react';
import { Task, TaskCategory } from '../../contexts/TaskContext';
import { AvatarStack } from '../ui/AvatarStack';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  showCategory?: boolean;
  onClick?: (taskId: string) => void;
}

const categoryColors: Record<TaskCategory, string> = {
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  docs: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  messages: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  receipts: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

const categoryLabels: Record<TaskCategory, string> = {
  general: 'General',
  docs: 'Docs',
  messages: 'Messages',
  receipts: 'Receipts',
};

export default function TaskItem({ task, onToggle, showCategory = false, onClick }: TaskItemProps) {
  const handleContentClick = () => {
    if (onClick) {
      onClick(task.id);
    }
  };

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5 transition-all ${
          task.is_completed
            ? 'bg-emerald-500 border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500'
        }`}
      >
        {task.is_completed && <Check className="w-full h-full text-white" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          onClick={handleContentClick}
          className={`text-sm ${
            task.is_completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          } ${onClick ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors' : ''}`}
        >
          {task.content}
        </p>
        {showCategory && (
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${categoryColors[task.category]}`}>
            {categoryLabels[task.category]}
          </span>
        )}
      </div>

      {task.assigned_profiles && task.assigned_profiles.length > 0 && (
        <div className="flex-shrink-0 ml-2">
          <AvatarStack users={task.assigned_profiles} maxVisible={2} size="sm" />
        </div>
      )}
    </div>
  );
}
