import { useTheme } from '../../contexts/ThemeContext';

export default function ThinkingIndicator() {
  const { theme } = useTheme();

  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 p-1.5 shadow-sm">
        <img
          src={theme === 'dark' ? '/Grok_Logomark_Light.png' : '/Grok_Logomark_Dark.png'}
          alt="Grok"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="max-w-[75%] rounded-2xl px-4 py-3 shadow-sm bg-white border border-gray-200 dark:bg-slate-800/90 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Grok is thinking
          </span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full animate-bounce bg-emerald-500 dark:bg-emerald-400" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce bg-emerald-500 dark:bg-emerald-400" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce bg-emerald-500 dark:bg-emerald-400" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
