import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { createTodo } from '../../lib/todos';
import { useToast } from '../../contexts/ToastContext';
import { UserPicker } from '../todos/UserPicker';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ComposeMessageModal({ isOpen, onClose, onSuccess }: ComposeMessageModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const { error } = await createTodo({
      content: title,
      description: content,
      category: 'messages',
      assigned_users: assignedUsers.length > 0 ? assignedUsers.map(u => u.id) : undefined,
    });

    if (error) {
      showToast('Failed to send message', 'error');
    } else {
      showToast('Message sent successfully', 'success');
      setTitle('');
      setContent('');
      setAssignedUsers([]);
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
            New Message
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
            <label htmlFor="message-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <Input
              id="message-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Message subject"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="message-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              id="message-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Send To
            </label>
            <UserPicker
              selectedUsers={assignedUsers}
              onSelectionChange={setAssignedUsers}
            />
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
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
