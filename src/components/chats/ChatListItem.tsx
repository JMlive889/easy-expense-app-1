import { MessageSquare, Bookmark, Trash2 } from 'lucide-react';
import { Chat } from '../../lib/chats';

interface ChatListItemProps {
  chat: Chat;
  onClick: () => void;
  onToggleBookmark: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function ChatListItem({ chat, onClick, onToggleBookmark, onDelete }: ChatListItemProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border transition-all cursor-pointer bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm dark:bg-slate-800/50 dark:border-slate-700"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20">
          <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate mb-1 text-slate-900 dark:text-white">
            {chat.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(chat.updated_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleBookmark}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Bookmark
              className={`w-4 h-4 ${
                chat.bookmarked
                  ? 'fill-current text-emerald-500'
                  : 'text-gray-400'
              }`}
            />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-lg transition-colors hover:bg-red-50 text-red-600 dark:hover:bg-red-500/20 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
