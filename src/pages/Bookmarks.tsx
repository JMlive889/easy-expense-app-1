import { useState, useEffect } from 'react';
import { AppHeader } from '../components/AppHeader';
import { PageType } from '../App';
import { useDocuments, useToggleDocumentBookmark, useDeleteDocument } from '../hooks/useDocuments';
import { getBookmarkedTodosByCategory, Todo, toggleTodoBookmark, toggleTodoComplete, deleteTodo } from '../lib/todos';
import { getChats, Chat, updateChat } from '../lib/chats';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentListItem } from '../components/documents/DocumentListItem';
import { TodoListItem } from '../components/todos/TodoListItem';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal';
import { TodoDetailModal } from '../components/todos/TodoDetailModal';
import { ViewToggle, ViewMode } from '../components/documents/ViewToggle';
import { useToast } from '../contexts/ToastContext';
import { Bookmark, MessageSquare, FileText, Receipt } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Document } from '../lib/documents';

interface BookmarksProps {
  onNavigate: (page: PageType, chatId?: string) => void;
}

type TabType = 'docs' | 'messages' | 'receipts' | 'chats';

const RECEIPT_TYPES = ['receipt', 'meal', 'travel', 'office-supplies', 'equipment', 'utilities'];

export function Bookmarks({ onNavigate }: BookmarksProps) {
  const [activeTab, setActiveTab] = useState<TabType>('docs');
  const [messageTodos, setMessageTodos] = useState<Todo[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewPreference, setViewPreference] = useState<ViewMode>('grid');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { showToast } = useToast();
  const { theme } = useTheme();
  const { profile, updateProfile } = useAuth();

  const { data: bookmarkedDocs = [], isLoading: docsLoading } = useDocuments({
    bookmark: true
  });

  const toggleDocumentBookmark = useToggleDocumentBookmark();
  const deleteDocument = useDeleteDocument();

  const docs = bookmarkedDocs.filter(doc => !RECEIPT_TYPES.includes(doc.type || ''));
  const receipts = bookmarkedDocs.filter(doc => RECEIPT_TYPES.includes(doc.type || ''));

  useEffect(() => {
    loadMessageTodos();
    loadChats();
  }, []);

  useEffect(() => {
    if (profile?.view_preference) {
      setViewPreference(profile.view_preference as ViewMode);
    }
  }, [profile]);

  const loadMessageTodos = async () => {
    try {
      setLoading(true);
      const { data, error } = await getBookmarkedTodosByCategory('messages');
      if (error) throw error;
      setMessageTodos(data || []);
    } catch (error) {
      console.error('Failed to load bookmarked messages:', error);
      showToast('Failed to load bookmarked messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      const data = await getChats(true);
      setChats(data);
    } catch (error) {
      console.error('Failed to load bookmarked chats:', error);
      showToast('Failed to load bookmarked chats', 'error');
    }
  };

  const handleViewModeChange = async (newViewMode: ViewMode) => {
    setViewPreference(newViewMode);

    try {
      await updateProfile({ view_preference: newViewMode });
    } catch (error) {
      console.error('Failed to save view preference:', error);
    }
  };

  const handleToggleTodoBookmark = async (todoId: string, bookmark: boolean) => {
    try {
      await toggleTodoBookmark(todoId, bookmark);
      await loadMessageTodos();
      showToast(bookmark ? 'Bookmarked' : 'Bookmark removed', 'success');
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      showToast('Failed to update bookmark', 'error');
    }
  };

  const handleToggleTodoComplete = async (todoId: string, isCompleted: boolean) => {
    try {
      await toggleTodoComplete(todoId, isCompleted);
      await loadMessageTodos();
      showToast(isCompleted ? 'Message completed' : 'Message reopened', 'success');
    } catch (error) {
      console.error('Failed to toggle complete:', error);
      showToast('Failed to update message', 'error');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteTodo(todoId);
      await loadMessageTodos();
      showToast('Message deleted', 'success');
    } catch (error) {
      console.error('Failed to delete message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

  const handleToggleChatBookmark = async (chatId: string) => {
    try {
      await updateChat(chatId, { bookmarked: false });
      await loadChats();
      showToast('Bookmark removed', 'success');
    } catch (error) {
      console.error('Failed to toggle chat bookmark:', error);
      showToast('Failed to update bookmark', 'error');
    }
  };

  const handleChatClick = (chatId: string) => {
    onNavigate('chats', chatId);
  };

  const handleToggleDocumentBookmark = async (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await toggleDocumentBookmark.mutateAsync({
        id: document.id,
        bookmark: !document.bookmark
      });
      showToast('Bookmark removed', 'success');
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      showToast('Failed to update bookmark', 'error');
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    setShowDetailModal(true);
  };

  const handleDetailClose = () => {
    setShowDetailModal(false);
    setSelectedDocument(null);
  };

  const handleMessageClick = (todo: Todo) => {
    setSelectedTodo(todo);
  };


  const tabs = [
    { id: 'docs' as TabType, label: 'Docs', icon: FileText, count: docs.length },
    { id: 'messages' as TabType, label: 'Messages', icon: MessageSquare, count: messageTodos.length },
    { id: 'receipts' as TabType, label: 'Receipts', icon: Receipt, count: receipts.length },
    { id: 'chats' as TabType, label: 'Chats', icon: Bookmark, count: chats.length },
  ];

  const isLoading = docsLoading || loading;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Bookmarks"
        currentPage="bookmarks"
        onNavigate={onNavigate}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="max-w-4xl mx-auto p-6 pb-32 lg:pb-8">
        <div className="rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <ViewToggle view={viewPreference} onChange={handleViewModeChange} />
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'docs' && (
                  <div>
                    {docs.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <p className="text-lg font-medium text-slate-900 dark:text-white">
                          No bookmarked documents
                        </p>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          Bookmark documents to access them quickly
                        </p>
                      </div>
                    ) : (
                      <div className={viewPreference === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
                        {docs.map((doc) =>
                          viewPreference === 'grid' ? (
                            <DocumentCard
                              key={doc.id}
                              document={doc}
                              onClick={() => handleDocumentClick(doc)}
                              onToggleBookmark={(e) => handleToggleDocumentBookmark(doc, e)}
                            />
                          ) : (
                            <DocumentListItem
                              key={doc.id}
                              document={doc}
                              onClick={() => handleDocumentClick(doc)}
                              onToggleBookmark={(e) => handleToggleDocumentBookmark(doc, e)}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'messages' && (
                  <div>
                    {messageTodos.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <p className="text-lg font-medium text-slate-900 dark:text-white">
                          No bookmarked messages
                        </p>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          Bookmark messages to find them easily later
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messageTodos.map((todo) => (
                          <TodoListItem
                            key={todo.id}
                            todo={todo}
                            onClick={() => handleMessageClick(todo)}
                            onToggleComplete={() => {}}
                            onToggleBookmark={(todoId, bookmark) => handleToggleTodoBookmark(todoId, bookmark)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'receipts' && (
                  <div>
                    {receipts.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <p className="text-lg font-medium text-slate-900 dark:text-white">
                          No bookmarked receipts
                        </p>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          Bookmark receipts for quick access
                        </p>
                      </div>
                    ) : (
                      <div className={viewPreference === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
                        {receipts.map((doc) =>
                          viewPreference === 'grid' ? (
                            <DocumentCard
                              key={doc.id}
                              document={doc}
                              onClick={() => handleDocumentClick(doc)}
                              onToggleBookmark={(e) => handleToggleDocumentBookmark(doc, e)}
                            />
                          ) : (
                            <DocumentListItem
                              key={doc.id}
                              document={doc}
                              onClick={() => handleDocumentClick(doc)}
                              onToggleBookmark={(e) => handleToggleDocumentBookmark(doc, e)}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chats' && (
                  <div>
                    {chats.length === 0 ? (
                      <div className="text-center py-12">
                        <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <p className="text-lg font-medium text-slate-900 dark:text-white">
                          No bookmarked chats
                        </p>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          Bookmark AI conversations to revisit them later
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chats.map((chat) => (
                          <div
                            key={chat.id}
                            className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => handleChatClick(chat.id)}
                            >
                              <h3 className="font-medium truncate text-slate-900 dark:text-white">
                                {chat.title}
                              </h3>
                              <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                                Last updated {new Date(chat.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleChatBookmark(chat.id);
                              }}
                              className="ml-4 p-2 rounded-lg transition-colors text-yellow-500 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              <Bookmark className="w-5 h-5 fill-current" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <DocumentDetailModal
        document={selectedDocument}
        isOpen={showDetailModal}
        onClose={handleDetailClose}
        onUpdate={() => {}}
        deleteMutation={deleteDocument}
      />

      {selectedTodo && (
        <TodoDetailModal
          todo={selectedTodo}
          isOpen={!!selectedTodo}
          onClose={() => {
            setSelectedTodo(null);
            loadMessageTodos();
          }}
          onToggleComplete={handleToggleTodoComplete}
          onToggleBookmark={handleToggleTodoBookmark}
          onDelete={handleDeleteTodo}
          onUpdate={loadMessageTodos}
        />
      )}
    </div>
  );
}
