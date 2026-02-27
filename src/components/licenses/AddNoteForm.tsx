import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface AddNoteFormProps {
  onAdd: (content: string) => Promise<boolean>;
}

export function AddNoteForm({ onAdd }: AddNoteFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || content.length > 250) return;

    setIsSubmitting(true);
    const success = await onAdd(content);
    setIsSubmitting(false);

    if (success) {
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add Note
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          rows={4}
          maxLength={250}
          placeholder="Write a note about this user... (max 250 characters)"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${
            content.length > 250
              ? 'text-red-600 dark:text-red-400 font-medium'
              : content.length > 225
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {content.length}/250 characters
          </span>
          <Button
            type="submit"
            disabled={!content.trim() || content.length > 250 || isSubmitting}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </Button>
        </div>
      </div>
    </form>
  );
}
