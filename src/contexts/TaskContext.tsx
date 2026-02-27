import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export type TaskCategory = 'general' | 'docs' | 'messages' | 'receipts';

export interface Task {
  id: string;
  content: string;
  category: TaskCategory;
  is_completed: boolean;
  entity_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assigned_profiles?: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  }>;
}

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  activeCategory: TaskCategory;
  setActiveCategory: (category: TaskCategory) => void;
  createTask: (content: string, category: TaskCategory) => Promise<{ error: any }>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<{ error: any }>;
  deleteTask: (id: string) => Promise<{ error: any }>;
  toggleTaskComplete: (id: string) => Promise<{ error: any }>;
  getTasksByCategory: (category: TaskCategory, includeCompleted?: boolean) => Task[];
  getAllTasks: (includeCompleted?: boolean) => Task[];
  getTaskCount: (category: TaskCategory) => number;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('general');
  const { entity, user } = useAuth();
  const { showToast } = useToast();

  const fetchTasks = useCallback(async () => {
    if (!entity) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('entity_id', entity.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        showToast('Failed to load tasks', 'error');
        return;
      }

      setTasks(data || []);
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [entity, showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (content: string, category: TaskCategory) => {
    if (!entity || !user) {
      return { error: new Error('No entity or user available') };
    }

    if (!content.trim()) {
      return { error: new Error('Task content cannot be empty') };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          content: content.trim(),
          category,
          entity_id: entity.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return { error };
      }

      setTasks([data, ...tasks]);
      showToast('Task created successfully', 'success');
      return { error: null };
    } catch (err) {
      console.error('Unexpected error creating task:', err);
      return { error: err };
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating task:', error);
        return { error };
      }

      setTasks(tasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      ));

      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating task:', err);
      return { error: err };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
        return { error };
      }

      setTasks(tasks.filter(task => task.id !== id));
      showToast('Task deleted', 'success');
      return { error: null };
    } catch (err) {
      console.error('Unexpected error deleting task:', err);
      showToast('Failed to delete task', 'error');
      return { error: err };
    }
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return { error: new Error('Task not found') };

    const newCompletedState = !task.is_completed;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: newCompletedState })
        .eq('id', id);

      if (error) {
        console.error('Error toggling task:', error);
        return { error };
      }

      setTasks(tasks.map(t =>
        t.id === id
          ? {
              ...t,
              is_completed: newCompletedState,
              completed_at: newCompletedState ? new Date().toISOString() : null
            }
          : t
      ));

      return { error: null };
    } catch (err) {
      console.error('Unexpected error toggling task:', err);
      return { error: err };
    }
  };

  const getTasksByCategory = (category: TaskCategory, includeCompleted = false) => {
    return tasks.filter(task =>
      task.category === category && (includeCompleted || !task.is_completed)
    );
  };

  const getAllTasks = (includeCompleted = false) => {
    return tasks.filter(task => includeCompleted || !task.is_completed);
  };

  const getTaskCount = (category: TaskCategory) => {
    return tasks.filter(task => task.category === category && !task.is_completed).length;
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        activeCategory,
        setActiveCategory,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        getTasksByCategory,
        getAllTasks,
        getTaskCount,
        refreshTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
