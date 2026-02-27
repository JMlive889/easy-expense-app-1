import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Avatar from '../Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { Profile } from '../../lib/supabase';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  profile?: Profile | null;
}

export default function MessageBubble({ role, content, isStreaming, profile }: MessageBubbleProps) {
  const isUser = role === 'user';
  const { theme } = useTheme();

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="sm" />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 p-1.5 shadow-sm">
            <img
              src={theme === 'dark' ? '/Grok_Logomark_Light.png' : '/Grok_Logomark_Dark.png'}
              alt="Grok"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
          : 'bg-white border border-gray-200 text-slate-900 dark:bg-slate-800/90 dark:border-slate-700 dark:text-white'
      }`}>
        <div className={`text-sm prose prose-sm max-w-none ${
          isUser
            ? 'prose-invert'
            : 'dark:prose-invert'
        }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 last:mb-0 ml-4 list-disc space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 last:mb-0 ml-4 list-decimal space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                  isUser
                    ? 'bg-white/20'
                    : 'bg-gray-100 dark:bg-slate-900/50'
                }`}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className={`p-3 rounded-lg overflow-x-auto my-2 ${
                  isUser
                    ? 'bg-white/10'
                    : 'bg-gray-100 dark:bg-slate-900/50'
                }`}>
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
