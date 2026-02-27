import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getChatMessages, Message, getChat } from '../../lib/chats';
import { useGrokChat } from '../../hooks/useGrokChat';
import { useDocumentAnalysis } from '../../hooks/useDocumentAnalysis';
import { GrokMessage, DocumentAnalysisParams } from '../../lib/grok';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ThinkingIndicator from './ThinkingIndicator';
import { AppHeader } from '../AppHeader';
import { PageType } from '../../App';

interface ChatViewProps {
  chatId: string;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function ChatView({ chatId, onBack, onNavigate }: ChatViewProps) {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldStartAnalysis, setShouldStartAnalysis] = useState(false);

  const { sendMessage, isStreaming, streamingContent, error } = useGrokChat(chatId);
  const { analyzeDocument, isAnalyzing, analysisContent, error: analysisError, visionFallbackUsed } = useDocumentAnalysis(chatId);

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, analysisContent]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  useEffect(() => {
    if (analysisError) {
      showToast(analysisError, 'error');
    }
  }, [analysisError, showToast]);

  useEffect(() => {
    if (visionFallbackUsed) {
      showToast('Could not load document for analysis — try uploading an image version', 'warning');
    }
  }, [visionFallbackUsed, showToast]);

  useEffect(() => {
    if (shouldStartAnalysis && messages.length > 0) {
      checkAndStartAnalysis();
    }
  }, [shouldStartAnalysis, messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getChatMessages(chatId);
      setMessages(data);

      if (data.length === 1 && data[0].role === 'user') {
        const chat = await getChat(chatId);
        if (chat?.title.startsWith('Analyze ')) {
          setShouldStartAnalysis(true);
        }
      }
    } catch (err) {
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkAndStartAnalysis = async () => {
    if (isAnalyzing || messages.length !== 1 || messages[0].role !== 'user') {
      return;
    }

    const userMessage = messages[0].content;
    const documentNameMatch = userMessage.match(/Analyze this .+ named "(.+)"\./);

    if (!documentNameMatch) {
      return;
    }

    const chat = await getChat(chatId);
    if (!chat || !chat.title.startsWith('Analyze ')) {
      return;
    }

    setShouldStartAnalysis(false);

    const documentName = chat.title.replace('Analyze ', '');

    try {
      const sessionData = sessionStorage.getItem(`doc-analysis-${chatId}`);
      if (!sessionData) {
        return;
      }

      const analysisParams: DocumentAnalysisParams = JSON.parse(sessionData);

      const message = await analyzeDocument(analysisParams);

      if (message) {
        setMessages(prev => [...prev, message]);
      }

      sessionStorage.removeItem(`doc-analysis-${chatId}`);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    const conversationHistory: GrokMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const isFirstMessage = messages.length === 0;
    const newMessage = await sendMessage(content, conversationHistory, isFirstMessage);

    if (newMessage) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), chat_id: chatId, role: 'user', content, created_at: new Date().toISOString() },
        newMessage,
      ]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppHeader
        pageTitle="Chats"
        currentPage={'chats' as PageType}
        onNavigate={onNavigate || (() => {})}
        onBack={onBack}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-4xl mx-auto p-4 pb-4">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-white dark:bg-slate-800 p-3 shadow-lg">
                <img
                  src={theme === 'dark' ? '/Grok_Logomark_Light.png' : '/Grok_Logomark_Dark.png'}
                  alt="Grok"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                Chat with Grok
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Ask me anything about your documents, receipts, or accounting questions
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  profile={profile}
                />
              ))}

              {(isStreaming || isAnalyzing) && !streamingContent && !analysisContent && <ThinkingIndicator />}

              {isStreaming && streamingContent && (
                <MessageBubble
                  role="assistant"
                  content={streamingContent}
                  isStreaming={true}
                  profile={profile}
                />
              )}

              {isAnalyzing && analysisContent && (
                <MessageBubble
                  role="assistant"
                  content={analysisContent}
                  isStreaming={true}
                  profile={profile}
                />
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <MessageInput
        onSend={handleSendMessage}
        disabled={isStreaming || isAnalyzing}
        placeholder={isStreaming || isAnalyzing ? 'Grok is thinking...' : 'Ask Grok anything...'}
      />
    </div>
  );
}
