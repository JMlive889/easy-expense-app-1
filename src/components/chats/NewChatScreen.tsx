import MessageInput from './MessageInput';
import { AppHeader } from '../AppHeader';
import { PageType } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NewChatScreenProps {
  onSendFirstMessage: (message: string) => void;
  disabled?: boolean;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function NewChatScreen({ onSendFirstMessage, disabled, onBack, onNavigate }: NewChatScreenProps) {
  const { profile } = useAuth();
  const { theme } = useTheme();

  const suggestions = [
    'Help me organize my receipts',
    'What expenses can I deduct?',
    'Explain quarterly taxes',
    'Track business expenses',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppHeader
        pageTitle="Chats"
        currentPage="chats"
        onNavigate={onNavigate as (page: PageType) => void}
        onBack={onBack}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg bg-white dark:bg-slate-800 p-4">
          <img
            src={theme === 'dark' ? '/Grok_Logomark_Light.png' : '/Grok_Logomark_Dark.png'}
            alt="Grok"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">
          Chat with Grok
        </h1>

        <p className="text-center text-lg mb-8 max-w-md text-gray-600 dark:text-gray-400">
          Your AI assistant for accounting, receipts, and document management
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSendFirstMessage(suggestion)}
              disabled={disabled}
              className={`p-4 rounded-xl text-left transition-all bg-white border border-gray-200 hover:border-emerald-500/50 text-slate-900 shadow-sm dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-emerald-500/50 dark:text-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <p className="text-sm">{suggestion}</p>
            </button>
          ))}
        </div>
      </div>

      <MessageInput
        onSend={onSendFirstMessage}
        disabled={disabled}
        placeholder="Start a conversation with Grok..."
      />
    </div>
  );
}
