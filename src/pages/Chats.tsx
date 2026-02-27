import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Plus, Search } from 'lucide-react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { AppHeader } from '../components/AppHeader';
import ChatView from '../components/chats/ChatView';
import NewChatScreen from '../components/chats/NewChatScreen';
import ChatListItem from '../components/chats/ChatListItem';
import ConfirmModal from '../components/ui/ConfirmModal';
import { getChats, createChat, deleteChat, toggleChatBookmark, createMessage, Chat } from '../lib/chats';
import { useGrokChat } from '../hooks/useGrokChat';
import { GrokMessage } from '../lib/grok';
import { useAuth } from '../contexts/AuthContext';

interface ChatsProps {
  onNavigate: (page: string, chatId?: string | null) => void;
  initialChatId?: string | null;
}

export default function Chats({ onNavigate, initialChatId }: ChatsProps) {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'chat' | 'new'>('list');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { sendMessage, isStreaming } = useGrokChat(activeChatId);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (initialChatId) {
      setActiveChatId(initialChatId);
      setActiveView('chat');
    }
  }, [initialChatId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chats.filter(chat =>
        chat.title.toLowerCase().includes(query)
      );

      // Sort filtered results: bookmarked first, then by date
      filtered.sort((a, b) => {
        if (a.bookmarked !== b.bookmarked) {
          return b.bookmarked ? 1 : -1;
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const data = await getChats();
      setChats(data);
      setFilteredChats(data);
    } catch (err) {
      showToast('Failed to load chats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async () => {
    setActiveView('new');
  };

  const handleSendFirstMessage = async (content: string) => {
    try {
      setCreatingChat(true);
      const newChat = await createChat({ title: 'New Chat' });
      setActiveChatId(newChat.id);

      const conversationHistory: GrokMessage[] = [];
      const newMessage = await sendMessage(content, conversationHistory, true);

      if (newMessage) {
        setActiveView('chat');
        await loadChats();
      }
    } catch (err) {
      showToast('Failed to create chat', 'error');
      setActiveView('list');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveView('chat');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setActiveChatId(null);
    loadChats();
  };

  const handleToggleBookmark = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleChatBookmark(chatId);
      await loadChats();
    } catch (err) {
      showToast('Failed to update bookmark', 'error');
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;

    try {
      setDeleting(true);
      await deleteChat(chatToDelete);
      await loadChats();
      showToast('Chat deleted', 'success');
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    } catch (err) {
      showToast('Failed to delete chat', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  if (activeView === 'chat' && activeChatId) {
    return <ChatView chatId={activeChatId} onBack={handleBackToList} onNavigate={onNavigate} />;
  }

  if (activeView === 'new') {
    return (
      <AuthGuard>
        <NewChatScreen
          onSendFirstMessage={handleSendFirstMessage}
          disabled={creatingChat || isStreaming}
          onBack={handleBackToList}
          onNavigate={onNavigate}
        />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <AppHeader
          pageTitle="Chats"
          currentPage="chats"
          onNavigate={onNavigate}
          headerVisible={profile?.header_visible ?? true}
        />

        <div className="max-w-4xl mx-auto p-6 pb-32 lg:pb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Chats
            </h1>
            <button
              onClick={handleCreateChat}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-emerald-500/50 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          <div className="relative mb-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-slate-900 placeholder-gray-400 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <img
                  src='/Grok_Logomark_Light.png' srcSet='/Grok_Logomark_Dark.png'
                  alt="Grok"
                  className="w-20 h-20 object-contain opacity-40"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try a different search term' : 'Start a conversation with Grok'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateChat}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-6 py-3 font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/50 active:scale-95"
                >
                  Start Chatting
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  onClick={() => handleChatClick(chat.id)}
                  onToggleBookmark={(e) => handleToggleBookmark(chat.id, e)}
                  onDelete={(e) => handleDeleteChat(chat.id, e)}
                />
              ))}
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete Chat"
          message="Are you sure you want to delete this chat? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={deleting}
        />
      </div>
    </AuthGuard>
  );
}
