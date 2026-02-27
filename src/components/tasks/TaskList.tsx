import { Task, TaskCategory } from '../../contexts/TaskContext';
import TaskItem from './TaskItem';
import { CheckCircle2 } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  category: TaskCategory;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  showCategory?: boolean;
  onClick?: (taskId: string) => void;
}

const emptyMessages: Record<TaskCategory, string> = {
  general: 'No tasks yet. Add one to get started!',
  docs: 'No document tasks. Stay organized!',
  messages: 'No messages to handle. You\'re all caught up!',
  receipts: 'No receipts to track. Nice work!',
};

export default function TaskList({ tasks, category, onToggle, onDelete, showCategory = false, onClick }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {showCategory ? 'No tasks found.' : emptyMessages[category]}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          showCategory={showCategory}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
