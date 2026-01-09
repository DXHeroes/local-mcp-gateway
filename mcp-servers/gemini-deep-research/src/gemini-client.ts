/**
 * Gemini API client wrapper for Deep Research functionality
 *
 * Uses the official Interactions API for the Deep Research Agent.
 * See: https://ai.google.dev/gemini-api/docs/deep-research
 */

import { GoogleGenAI } from '@google/genai';

export interface DeepResearchInput {
  topic: string;
  formatInstructions?: string;
}

export interface DeepResearchResult {
  content: string;
  interactionId: string;
  citations?: string[];
  status: 'completed' | 'failed';
  error?: string;
}

/**
 * Extract text from Content_2 union type
 * Content_2 can be TextContent, ImageContent, etc.
 */
function extractTextFromContent(content: unknown): string {
  if (content && typeof content === 'object' && 'type' in content) {
    const typedContent = content as { type: string; text?: string };
    if (typedContent.type === 'text' && typeof typedContent.text === 'string') {
      return typedContent.text;
    }
  }
  return '';
}

/**
 * Gemini API client for Deep Research
 *
 * Uses the Interactions API with the deep-research-pro-preview agent.
 * Research tasks run in the background and may take several minutes.
 */
export class GeminiClient {
  private client: GoogleGenAI;
  private agentName = 'deep-research-pro-preview-12-2025';

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Validate the API key by making a lightweight API call
   *
   * Uses models.list() which is fast and read-only.
   * @returns Validation result with valid status and error message if failed
   */
  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Use models.list() - lightweight, read-only, ~100ms
      const pager = await this.client.models.list({ config: { pageSize: 1 } });
      // Just iterate once to trigger the API call
      for await (const _model of pager) {
        break;
      }
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for authentication errors
      if (
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('UNAUTHENTICATED') ||
        errorMessage.includes('PERMISSION_DENIED') ||
        errorMessage.includes('API_KEY_INVALID') ||
        errorMessage.includes('invalid api key') ||
        errorMessage.toLowerCase().includes('api key not valid')
      ) {
        return { valid: false, error: 'Invalid API key' };
      }

      return { valid: false, error: `Validation failed: ${errorMessage}` };
    }
  }

  /**
   * Perform deep research on a topic
   *
   * This method starts a background research task and polls for completion.
   * Research tasks typically take 5-20 minutes to complete.
   *
   * @param input - Research input with topic and optional formatting instructions
   * @returns Research result with content and citations
   */
  async deepResearch(input: DeepResearchInput): Promise<DeepResearchResult> {
    // Build prompt with optional formatting instructions
    let prompt = input.topic;
    if (input.formatInstructions) {
      prompt += `\n\n${input.formatInstructions}`;
    }

    // Start background research task
    // The agent has access to google_search and url_context tools by default
    const interaction = await this.client.interactions.create({
      input: prompt,
      agent: this.agentName,
      background: true,
    });

    const interactionId = interaction.id;
    console.log(`[GeminiDeepResearch] Research started: ${interactionId}`);

    // Poll for completion (max 60 min timeout per docs)
    const maxWaitMs = 60 * 60 * 1000; // 60 minutes
    const pollIntervalMs = 10 * 1000; // 10 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.client.interactions.get(interactionId);

      if (result.status === 'completed') {
        const outputs = result.outputs || [];
        // Find the last text content in outputs
        let content = '';
        for (let i = outputs.length - 1; i >= 0; i--) {
          const text = extractTextFromContent(outputs[i]);
          if (text) {
            content = text;
            break;
          }
        }

        console.log(`[GeminiDeepResearch] Research completed: ${interactionId}`);

        return {
          content,
          interactionId: result.id,
          citations: this.extractCitations(result),
          status: 'completed',
        };
      }

      if (result.status === 'failed') {
        console.error(`[GeminiDeepResearch] Research failed: ${interactionId}`);

        return {
          content: '',
          interactionId: result.id,
          status: 'failed',
          error: 'Research failed. Check API key and try again.',
        };
      }

      // Log progress
      const elapsedMin = Math.round((Date.now() - startTime) / 60000);
      console.log(
        `[GeminiDeepResearch] Research in progress (${elapsedMin}min): ${interactionId}`
      );

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Research timed out after 60 minutes');
  }

  /**
   * Ask a follow-up question about a completed research
   *
   * @param previousInteractionId - The ID of the completed research interaction
   * @param question - The follow-up question to ask
   * @returns Research result with the answer
   */
  async followUp(previousInteractionId: string, question: string): Promise<DeepResearchResult> {
    const interaction = await this.client.interactions.create({
      input: question,
      agent: this.agentName,
      previous_interaction_id: previousInteractionId,
    });

    const outputs = interaction.outputs || [];
    // Find text content in outputs
    let content = '';
    for (let i = outputs.length - 1; i >= 0; i--) {
      const text = extractTextFromContent(outputs[i]);
      if (text) {
        content = text;
        break;
      }
    }

    return {
      content,
      interactionId: interaction.id,
      status: 'completed',
    };
  }

  /**
   * Extract citations from the interaction result
   *
   * The Deep Research agent returns grounded results with citations.
   * This method extracts citation URLs from the result.
   */
  private extractCitations(result: unknown): string[] {
    // The API response structure may include citations in various forms
    // This is a best-effort extraction based on common patterns
    const citations: string[] = [];

    try {
      const resultObj = result as Record<string, unknown>;

      // Check for citations in outputs
      const outputs = (resultObj.outputs || []) as Array<Record<string, unknown>>;
      for (const output of outputs) {
        // Check for annotations in TextContent
        if (output.type === 'text' && output.annotations) {
          const annotations = output.annotations as Array<Record<string, unknown>>;
          for (const annotation of annotations) {
            if (annotation.type === 'cite_source' && annotation.uri) {
              citations.push(annotation.uri as string);
            }
          }
        }

        // Check for grounding metadata
        const groundingMetadata = output.groundingMetadata as Record<string, unknown> | undefined;
        if (groundingMetadata?.groundingChunks) {
          const chunks = groundingMetadata.groundingChunks as Array<Record<string, unknown>>;
          for (const chunk of chunks) {
            if (chunk.web && typeof (chunk.web as Record<string, unknown>).uri === 'string') {
              citations.push((chunk.web as Record<string, unknown>).uri as string);
            }
          }
        }
      }
    } catch {
      // Silently ignore extraction errors
    }

    return [...new Set(citations)]; // Deduplicate
  }
}
