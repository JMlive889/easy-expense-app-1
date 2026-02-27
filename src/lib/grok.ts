export interface GrokContentPart {
  type: 'text';
  text: string;
}

export interface GrokImagePart {
  type: 'image_url';
  image_url: { url: string };
}

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<GrokContentPart | GrokImagePart>;
}

export interface GrokStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GrokUsageData {
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GrokChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Fallback model priority list for Grok API.
 * If the primary model is unavailable, the system will automatically try the next model in the list.
 */
const MODEL_FALLBACK_PRIORITY = ['grok-3', 'grok-4', 'grok-4-1-fast-reasoning'];

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Checks if an error is related to model availability (404 or deprecation).
 */
function isModelUnavailableError(status: number, errorText: string): boolean {
  return status === 404 || errorText.toLowerCase().includes('deprecated') || errorText.toLowerCase().includes('not found');
}

/**
 * Streams chat responses from Grok API with automatic model fallback.
 * If the primary model (grok-3) is unavailable, automatically tries fallback models.
 */
export async function* streamGrokChat(
  messages: GrokMessage[],
  options: GrokChatOptions = {}
): AsyncGenerator<string, GrokUsageData | undefined, unknown> {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;

  if (!apiKey) {
    throw new Error('XAI API key is not configured. Please add VITE_XAI_API_KEY to your .env file.');
  }

  // Try each model in fallback priority order
  const modelsToTry = options.model ? [options.model] : MODEL_FALLBACK_PRIORITY;
  let lastError: Error | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];

    try {
      console.group(`[Grok] streamGrokChat — model: ${currentModel}`);
      console.log('messages sent:', messages.map(m => ({
        role: m.role,
        contentSummary: Array.isArray(m.content)
          ? m.content.map(p => p.type === 'image_url'
              ? { type: 'image_url', urlPreview: (p as GrokImagePart).image_url.url.slice(0, 80) }
              : { type: 'text', length: (p as GrokContentPart).text.length })
          : [{ type: 'text', length: (m.content as string).length }]
      })));
      console.groupEnd();

      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();

        // Check if this is a model unavailability error and we have fallback options
        if (isModelUnavailableError(response.status, error) && i < modelsToTry.length - 1) {
          console.warn(`[Grok] Model ${currentModel} unavailable (${response.status}), trying next fallback model...`);
          continue;
        }

        throw new Error(`Grok API error: ${response.status} ${error}`);
      }

      console.log(`[Grok] streamGrokChat — ${currentModel} response OK, streaming started`);

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let usageData: GrokUsageData | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                return usageData;
              }

              try {
                const parsed: GrokStreamChunk = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;

                if (content) {
                  yield content;
                }

                if (parsed.usage) {
                  usageData = {
                    model_used: currentModel,
                    prompt_tokens: parsed.usage.prompt_tokens,
                    completion_tokens: parsed.usage.completion_tokens,
                    total_tokens: parsed.usage.total_tokens,
                  };
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return usageData;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If we have more models to try, continue the loop
      if (i < modelsToTry.length - 1) {
        continue;
      }

      // If this was the last model, throw the error
      throw lastError;
    }
  }

  // If we exhausted all models, throw the last error
  if (lastError) {
    throw lastError;
  }
}

/**
 * Calls Grok API for non-streaming responses with automatic model fallback.
 * If the primary model (grok-3) is unavailable, automatically tries fallback models.
 */
export async function callGrokChat(
  messages: GrokMessage[],
  options: GrokChatOptions = {}
): Promise<{ content: string; usage?: GrokUsageData }> {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;

  if (!apiKey) {
    throw new Error('XAI API key is not configured. Please add VITE_XAI_API_KEY to your .env file.');
  }

  // Try each model in fallback priority order
  const modelsToTry = options.model ? [options.model] : MODEL_FALLBACK_PRIORITY;
  let lastError: Error | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];

    try {
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();

        // Check if this is a model unavailability error and we have fallback options
        if (isModelUnavailableError(response.status, error) && i < modelsToTry.length - 1) {
          console.warn(`Model ${currentModel} unavailable, trying next fallback model...`);
          continue;
        }

        throw new Error(`Grok API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const usage = data.usage ? {
        model_used: currentModel,
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      } : undefined;

      return { content, usage };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If we have more models to try, continue the loop
      if (i < modelsToTry.length - 1) {
        continue;
      }

      // If this was the last model, throw the error
      throw lastError;
    }
  }

  // If we exhausted all models, throw the last error
  if (lastError) {
    throw lastError;
  }

  return { content: '' };
}

export class VisionFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisionFailureError';
  }
}

function isVisionRelatedError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes('invalid image') ||
    lower.includes('invalid url') ||
    lower.includes('unable to fetch') ||
    lower.includes('could not fetch') ||
    lower.includes('image url') ||
    lower.includes('unsupported image') ||
    lower.includes('image processing') ||
    lower.includes('failed to load') ||
    lower.includes('fetch image') ||
    lower.includes('image format')
  );
}

export async function analyzeImageWithGrok(
  imageUrl: string,
  prompt: string
): Promise<{ content: string; usage?: GrokUsageData }> {
  const messages: GrokMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    }
  ];

  const visionModels = ['grok-4', 'grok-4-1-fast-reasoning', 'grok-2-vision-1212'];
  for (const model of visionModels) {
    try {
      return await callGrokChat(messages, { model });
    } catch (error) {
      console.warn(`Vision model ${model} failed, trying next...`, error);
      if (model === visionModels[visionModels.length - 1]) throw error;
    }
  }
  throw new Error('All vision models failed');
}

export interface DocumentMetadata {
  type?: string;
  vendor?: string;
  amount?: number;
  tags?: string[];
  notes?: string;
}

export interface DocumentAnalysisParams {
  documentId: string;
  documentName: string;
  fileUrl: string;
  mimeType: string;
  metadata?: DocumentMetadata;
  pdfImageBase64?: string | null;
  pdfExtractedText?: string | null;
}

export function buildDocumentAnalysisPrompt(params: DocumentAnalysisParams): string {
  const { documentName, mimeType, metadata, pdfImageBase64, pdfExtractedText } = params;

  const isPDF = mimeType === 'application/pdf';
  const docType = metadata?.type || 'document';
  const hasImage = isPDF ? !!pdfImageBase64 : true;
  const hasTextLayer = isPDF && !!pdfExtractedText;
  const hasAnyContent = hasImage || hasTextLayer;

  let prompt = '';

  if (isPDF && hasTextLayer) {
    prompt += `**Extracted PDF Text (first page):**\n${pdfExtractedText}\n\n`;
  }

  if (isPDF && hasImage) {
    prompt += `This is a PDF document rendered as an image (first page only) — analyze all visible text, tables, layout, and numbers in the image.\n\n`;
  }

  if (!hasAnyContent) {
    prompt += `Note: Only document metadata is available for this analysis — no visual or text content could be extracted.\n\n`;
  }

  prompt += `You are an expert accountant. Analyze the provided ${hasImage ? 'image/PDF' : 'text'} of this document ("${documentName}", ${docType}).\n\n`;

  prompt += `Extract the following with precision:\n`;
  prompt += `- **Amounts**: total, subtotal, tax (list each separately with labels)\n`;
  prompt += `- **Dates**: issue date, due date, transaction date (all that are present)\n`;
  prompt += `- **Vendor**: name, address, contact details\n`;
  prompt += `- **Invoice/Reference #**: invoice number, PO number, or reference ID\n`;
  prompt += `- **Payment Terms**: net days, early payment discounts, late fees\n`;
  prompt += `- **Line Items**: description, quantity, unit price, and line total for each item\n\n`;

  prompt += `Also provide:\n`;
  prompt += `- **Suggested Bookkeeping Category**: the most appropriate chart-of-accounts category\n`;
  prompt += `- **Tax Deductibility**: whether this is likely deductible and under which expense type\n`;
  prompt += `- **Red Flags**: any anomalies, missing fields, inconsistencies, or concerns worth flagging\n\n`;

  if (hasImage) {
    prompt += `Be precise and rely on the visual content — do not assume values not visible in the document.\n\n`;
  }

  if (metadata) {
    const contextParts: string[] = [];

    if (metadata.vendor) contextParts.push(`Vendor: ${metadata.vendor}`);
    if (metadata.amount) contextParts.push(`Amount: $${metadata.amount.toFixed(2)}`);
    if (metadata.tags && metadata.tags.length > 0) contextParts.push(`Tags: ${metadata.tags.join(', ')}`);
    if (metadata.notes) contextParts.push(`Notes: ${metadata.notes}`);

    if (contextParts.length > 0) {
      prompt += `**Existing Metadata** (verify and correct as needed):\n${contextParts.join('\n')}\n\n`;
    }
  }

  prompt += `Provide a clear, structured analysis useful for accounting and bookkeeping purposes.`;

  return prompt;
}

function buildDocumentMessages(params: DocumentAnalysisParams): GrokMessage[] {
  const prompt = buildDocumentAnalysisPrompt(params);
  const isPDF = params.mimeType === 'application/pdf';

  const imageUrl = isPDF
    ? (params.pdfImageBase64 ?? null)
    : params.fileUrl;

  const userContent: Array<GrokContentPart | GrokImagePart> = [
    { type: 'text', text: prompt },
  ];

  if (imageUrl) {
    userContent.push({ type: 'image_url', image_url: { url: imageUrl } });
  }

  const messages: GrokMessage[] = [
    {
      role: 'system',
      content: 'You are an expert accountant and financial analyst with deep knowledge of bookkeeping, tax law, and financial compliance. Analyze documents thoroughly, extract all financial data with precision, and provide structured, actionable insights. When visual content is provided, rely on what you can see — do not invent or estimate values.',
    },
    {
      role: 'user',
      content: userContent,
    },
  ];

  console.group('[Grok] buildDocumentMessages');
  console.log('mimeType:', params.mimeType);
  console.log('isPDF:', isPDF);
  console.log('hasImageContent:', !!imageUrl);
  if (imageUrl) {
    const isBase64 = imageUrl.startsWith('data:');
    console.log('imageUrl type:', isBase64 ? 'base64 data URL' : 'remote URL');
    if (isBase64) {
      console.log('imageUrl preview (base64 length):', imageUrl.length, '— first 80 chars:', imageUrl.slice(0, 80));
    } else {
      console.log('imageUrl preview:', imageUrl.slice(0, 100));
    }
  }
  console.log('messages structure:', messages.map(m => ({
    role: m.role,
    contentType: typeof m.content,
    parts: Array.isArray(m.content)
      ? m.content.map(p => ({
          type: p.type,
          ...(p.type === 'image_url'
            ? { urlPreview: (p as GrokImagePart).image_url.url.slice(0, 80) }
            : { textLength: (p as GrokContentPart).text.length })
        }))
      : [{ textLength: (m.content as string).length }]
  })));
  console.groupEnd();

  return messages;
}

export async function analyzeDocumentWithVision(
  params: DocumentAnalysisParams
): Promise<{ content: string; usage?: GrokUsageData }> {
  const messages = buildDocumentMessages(params);
  const isPDF = params.mimeType === 'application/pdf';
  const hasImage = isPDF ? !!params.pdfImageBase64 : true;

  if (hasImage) {
    const visionModels = ['grok-4', 'grok-4-1-fast-reasoning', 'grok-2-vision-1212'];

    for (const model of visionModels) {
      try {
        return await callGrokChat(messages, { model, max_tokens: 3000 });
      } catch (error) {
        console.warn(`Vision model ${model} failed, trying next...`, error);
        if (model === visionModels[visionModels.length - 1]) {
          throw error;
        }
      }
    }

    throw new Error('All vision models failed');
  }

  return callGrokChat(messages, { max_tokens: 3000 });
}

export async function* streamDocumentAnalysis(
  params: DocumentAnalysisParams
): AsyncGenerator<string, void, unknown> {
  const messages = buildDocumentMessages(params);
  const isPDF = params.mimeType === 'application/pdf';
  const hasImage = isPDF ? !!params.pdfImageBase64 : true;

  console.log('[Grok] streamDocumentAnalysis start — hasImage:', hasImage, '| mimeType:', params.mimeType);

  if (hasImage) {
    const visionModels = ['grok-4', 'grok-4-1-fast-reasoning', 'grok-2-vision-1212'];
    let lastError: Error | null = null;
    let visionFailed = false;

    for (const model of visionModels) {
      try {
        console.log(`[Grok] Attempting vision model: ${model}`);
        yield* streamGrokChat(messages, { model, max_tokens: 3000 });
        console.log(`[Grok] Vision succeeded with model: ${model}`);
        return;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const isVisionErr = isVisionRelatedError(err.message);
        console.warn(`[Grok] Vision model ${model} failed — isVisionRelatedError: ${isVisionErr} — message: ${err.message}`);
        lastError = err;

        if (isVisionErr) {
          visionFailed = true;
          console.warn('[Grok] Vision-related error detected — stopping vision attempts, will throw VisionFailureError');
          break;
        }
      }
    }

    if (visionFailed) {
      throw new VisionFailureError(lastError?.message || 'Vision processing failed');
    }

    if (lastError) {
      throw lastError;
    }

    return;
  }

  console.log('[Grok] No image content — falling back to text-only analysis');
  yield* streamGrokChat(messages, { max_tokens: 3000 });
}
