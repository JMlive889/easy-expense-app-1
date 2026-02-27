import { useState, useCallback, useRef } from 'react';
import { streamGrokChat, GrokMessage } from '../lib/grok';
import { createMessage, updateChatTitle } from '../lib/chats';
import { getUserContext, formatContextForGrok } from '../lib/grokContext';
import { logGrokUsage } from '../lib/grokUsage';
import { useAuth } from '../contexts/AuthContext';

export function useGrokChat(chatId: string | null) {
  const { user, profile } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const contextCache = useRef<{ context: string; timestamp: number } | null>(null);
  const CONTEXT_EXPIRY_MS = 5 * 60 * 1000;

  const sendMessage = useCallback(
    async (userMessage: string, conversationHistory: GrokMessage[], isFirstMessage: boolean) => {
      if (!chatId) {
        setError('No active chat');
        return null;
      }

      setIsStreaming(true);
      setStreamingContent('');
      setError(null);

      try {
        await createMessage({
          chat_id: chatId,
          role: 'user',
          content: userMessage,
        });

        if (isFirstMessage) {
          await updateChatTitle(chatId, userMessage);
        }

        let userContextString = '';
        const now = Date.now();

        if (
          !contextCache.current ||
          now - contextCache.current.timestamp > CONTEXT_EXPIRY_MS ||
          isFirstMessage
        ) {
          const { data: userContext, error: contextError } = await getUserContext();

          if (!contextError && userContext) {
            userContextString = formatContextForGrok(userContext);
            contextCache.current = {
              context: userContextString,
              timestamp: now,
            };
          } else {
            console.warn('Failed to fetch user context:', contextError);
          }
        } else {
          userContextString = contextCache.current.context;
        }

        const baseSystemPrompt = `You are a straightforward expense tracker assistant powered by Grok. Keep responses short, direct, and helpful. Focus only on answering the user's question about expenses, receipts, amounts, vendors, summaries, or spending (e.g., totals by merchant, week, category).

Important rules for image/document analysis:
- If the user asks to analyze images, receipts, documents, or upload/scan anything in this main chat: Respond ONLY with this exact message (no additions or explanations):
  "You have to go to the Receipt or Document directly and press the Grok Chat icon from there to analyze that document."
- Do NOT attempt to analyze images uploaded here in the main chat menu.
- Do NOT discuss why, do NOT offer alternatives, do NOT say anything about limits, performance, or beer/alcohol — just give the exact redirect message above.
- For all other questions (amounts, summaries, totals by vendor/time): Answer briefly and directly. Never mention taxes unless explicitly asked.

Rules:
- Never start tax, accounting, deduction, IRS, or compliance discussions unless the user explicitly asks about taxes.
- Answer in 1-3 sentences max. Use simple language. One-sentence answers are ideal when possible.
- For questions like "Amount?", "What is this expense?", "Summarize", or "How much at Starbucks last week?": Pull the relevant data and reply concisely (e.g., "You spent $47.82 at Starbucks last week across 5 transactions.").
- If data is missing or unclear, say so briefly and ask for clarification.
- Be complete but brief – no long explanations, breakdowns, or unsolicited advice.

CRITICAL PERMISSION RULES (found in context below):
- The context will clearly indicate the user's access level (guest vs owner/accountant).
- GUESTS can only see their own personal data and documents shared with them. They have ZERO visibility into other users' data.
- If a guest asks entity-wide questions (e.g., "total company spending", "everyone's expenses", "all receipts"), respond with: "I can only see your personal expenses and documents shared with you. For entity-wide reports, please ask an owner or accountant."
- OWNERS and ACCOUNTANTS have full entity-wide access and can ask about all users, spending patterns, and financial summaries.
- Always respect the data boundaries specified in the context. Never make up or infer data outside the provided scope.`;

        const systemPrompt = userContextString
          ? `${baseSystemPrompt}\n\n${userContextString}`
          : baseSystemPrompt;

        const messages: GrokMessage[] = [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...conversationHistory,
          {
            role: 'user',
            content: userMessage,
          },
        ];

        let fullResponse = '';
        let usageData;

        const stream = streamGrokChat(messages);

        for await (const chunk of stream) {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        }

        try {
          const result = await stream.return(undefined);
          usageData = result?.value;
        } catch (e) {
          console.warn('Failed to get usage data from stream:', e);
        }

        const savedMessage = await createMessage({
          chat_id: chatId,
          role: 'assistant',
          content: fullResponse,
        });

        if (usageData && user && profile?.entity_id) {
          logGrokUsage({
            user_id: user.id,
            entity_id: profile.entity_id,
            usage_type: 'chat',
            usage_data: usageData,
            message_id: savedMessage?.id,
          }).catch(err => {
            console.error('Failed to log usage:', err);
          });
        }

        setIsStreaming(false);
        setStreamingContent('');

        return savedMessage;
      } catch (err) {
        setIsStreaming(false);
        setStreamingContent('');
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        return null;
      }
    },
    [chatId, user, profile]
  );

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    error,
  };
}
