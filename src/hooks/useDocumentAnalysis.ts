import { useState, useCallback } from 'react';
import { streamDocumentAnalysis, streamGrokChat, buildDocumentAnalysisPrompt, VisionFailureError, DocumentAnalysisParams, GrokMessage } from '../lib/grok';
import { createMessage } from '../lib/chats';
import { StreamBuffer } from '../lib/streamBuffer';
import { logGrokUsage } from '../lib/grokUsage';
import { useAuth } from '../contexts/AuthContext';

async function* streamTextOnlyAnalysis(params: DocumentAnalysisParams) {
  const prompt = buildDocumentAnalysisPrompt({ ...params, pdfImageBase64: null });
  const messages: GrokMessage[] = [
    {
      role: 'system',
      content: 'You are an expert accountant and financial analyst with deep knowledge of bookkeeping, tax law, and financial compliance. Analyze documents thoroughly, extract all financial data with precision, and provide structured, actionable insights.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];
  yield* streamGrokChat(messages, { max_tokens: 3000 });
}

export function useDocumentAnalysis(chatId: string | null) {
  const { user, profile } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisContent, setAnalysisContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [visionFallbackUsed, setVisionFallbackUsed] = useState(false);

  const analyzeDocument = useCallback(
    async (params: DocumentAnalysisParams) => {
      if (!chatId) {
        setError('No active chat');
        return null;
      }

      setIsAnalyzing(true);
      setAnalysisContent('');
      setError(null);
      setVisionFallbackUsed(false);

      const runStream = async (streamIterable: AsyncIterable<string>) => {
        let fullContent = '';
        let usageData;
        const buffer = new StreamBuffer((chunk) => {
          fullContent += chunk;
          setAnalysisContent(fullContent);
        }, 150);

        for await (const chunk of streamIterable) {
          buffer.add(chunk);
        }

        buffer.flush();

        const savedMessage = await createMessage({
          chat_id: chatId,
          role: 'assistant',
          content: fullContent,
        });

        if (usageData && user && profile?.entity_id) {
          logGrokUsage({
            user_id: user.id,
            entity_id: profile.entity_id,
            usage_type: 'document_analysis',
            usage_data: usageData,
            message_id: savedMessage?.id,
            document_id: params.documentId,
          }).catch(err => {
            console.error('Failed to log usage:', err);
          });
        }

        return savedMessage;
      };

      console.group('[useDocumentAnalysis] analyzeDocument called');
      console.log('documentId:', params.documentId);
      console.log('documentName:', params.documentName);
      console.log('mimeType:', params.mimeType);
      console.log('fileUrl preview:', params.fileUrl.slice(0, 100));
      console.log('hasPdfImageBase64:', !!params.pdfImageBase64, '— length:', params.pdfImageBase64?.length ?? 0);
      console.log('hasPdfExtractedText:', !!params.pdfExtractedText);
      console.groupEnd();

      try {
        const savedMessage = await runStream(streamDocumentAnalysis(params));
        setIsAnalyzing(false);
        return savedMessage;
      } catch (err) {
        if (err instanceof VisionFailureError) {
          console.warn('[useDocumentAnalysis] VisionFailureError caught — switching to text-only fallback. Reason:', err.message);
          setVisionFallbackUsed(true);
          try {
            console.log('[useDocumentAnalysis] Running text-only fallback analysis');
            const savedMessage = await runStream(streamTextOnlyAnalysis(params));
            setIsAnalyzing(false);
            return savedMessage;
          } catch (fallbackErr) {
            setIsAnalyzing(false);
            const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to analyze document';
            console.error('[useDocumentAnalysis] Text-only fallback also failed:', errorMessage);
            setError(errorMessage);
            return null;
          }
        }

        setIsAnalyzing(false);
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze document';
        console.error('[useDocumentAnalysis] Analysis failed (non-vision error):', errorMessage);
        setError(errorMessage);
        return null;
      }
    },
    [chatId, user, profile]
  );

  return {
    analyzeDocument,
    isAnalyzing,
    analysisContent,
    error,
    visionFallbackUsed,
  };
}
