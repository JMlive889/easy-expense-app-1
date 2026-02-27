import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import TaskList from './TaskList';
import { getTodosByCategory, toggleTodoComplete, toggleTodoBookmark, deleteTodo, Todo } from '../../lib/todos';
import { useToast } from '../../contexts/ToastContext';
import type { Task } from '../../contexts/TaskContext';
import { TodoDetailModal } from '../todos/TodoDetailModal';

interface ViewAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ViewAllModal({ isOpen, onClose, onRefresh }: ViewAllModalProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const { showToast } = useToast();

  const loadTodos = async () => {
    setLoading(true);
    const { data, error } = await getTodosByCategory(undefined, true);
    if (error) {
      console.error('Error loading todos:', error);
      showToast('Failed to load todos', 'error');
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadTodos();
    }
  }, [isOpen]);

  const convertTodoToTask = (todo: Todo): Task => ({
    id: todo.id,
    content: todo.title || todo.content,
    category: todo.category,
    is_completed: todo.is_completed,
    entity_id: todo.entity_id,
    created_by: todo.created_by,
    created_at: todo.created_at,
    updated_at: todo.updated_at,
    completed_at: todo.completed_at,
    assigned_profiles: todo.assigned_profiles,
  });

  const handleToggleComplete = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const { error } = await toggleTodoComplete(id, !todo.is_completed);
    if (error) {
      showToast('Failed to update todo', 'error');
    } else {
      await loadTodos();
      onRefresh?.();
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await deleteTodo(id);
    if (error) {
      showToast('Failed to delete todo', 'error');
    } else {
      showToast('Todo deleted', 'success');
      await loadTodos();
      onRefresh?.();
    }
  };

  const handleTodoClick = (taskId: string) => {
    const todo = todos.find(t => t.id === taskId);
    if (todo) {
      setSelectedTodo(todo);
      setShowTodoModal(true);
    }
  };

  const handleToggleBookmark = async (todoId: string, bookmark: boolean) => {
    try {
      const { error } = await toggleTodoBookmark(todoId, bookmark);
      if (error) throw error;
      await loadTodos();
      onRefresh?.();
      showToast(bookmark ? 'Bookmarked' : 'Removed bookmark', 'success');
      // Update the selected todo if it's open
      if (selectedTodo?.id === todoId) {
        setSelectedTodo({ ...selectedTodo, bookmark });
      }
    } catch (error) {
      showToast('Failed to bookmark todo', 'error');
    }
  };

  const handleTodoModalClose = () => {
    setShowTodoModal(false);
    setSelectedTodo(null);
  };

  const handleTodoUpdate = async () => {
    await loadTodos();
    onRefresh?.();
  };

  if (!isOpen) return null;

  const activeTasks = todos.filter(t => !t.is_completed).map(convertTodoToTask);
  const completedTasks = todos.filter(t => t.is_completed).map(convertTodoToTask);

  const displayTasks = showCompleted ? completedTasks : activeTasks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-8">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl h-[95vh] sm:h-[92vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Tasks
            </h2>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {showCompleted ? 'View Completed' : 'Active Tasks'}
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                  <button
                    onClick={() => {
                      setShowCompleted(false);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      !showCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Active Tasks
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleted(true);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      showCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    View Completed
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <TaskList
              tasks={displayTasks}
              category="general"
              onToggle={handleToggleComplete}
              onDelete={handleDeleteTask}
              showCategory={true}
              onClick={handleTodoClick}
            />
          )}
        </div>
      </div>

      {showTodoModal && selectedTodo && (
        <TodoDetailModal
          todo={selectedTodo}
          isOpen={showTodoModal}
          onClose={handleTodoModalClose}
          onToggleComplete={handleToggleComplete}
          onToggleBookmark={handleToggleBookmark}
          onDelete={handleDeleteTask}
          onUpdate={handleTodoUpdate}
        />
      )}
    </div>
  );
}
