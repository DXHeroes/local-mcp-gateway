/**
 * Gemini Deep Research MCP Server
 *
 * Provides deep research capabilities using Google's Deep Research Agent.
 * See: https://ai.google.dev/gemini-api/docs/deep-research
 */

import type { ApiKeyConfig, McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { McpServer } from '@dxheroes/local-mcp-core';
import { z } from 'zod';
import { GeminiClient } from './gemini-client.js';

/**
 * Input schema for the deep_research tool
 */
const DeepResearchInputSchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(10000, 'Topic must be less than 10000 characters')
    .describe(
      'The research topic or question to investigate. Be specific and detailed for better results.'
    ),
  formatInstructions: z
    .string()
    .optional()
    .describe(
      'Optional formatting instructions for the output. Example: "Format as a technical report with: 1. Executive Summary, 2. Key Findings, 3. Detailed Analysis, 4. Conclusions"'
    ),
});

type DeepResearchInput = z.infer<typeof DeepResearchInputSchema>;

/**
 * Input schema for the deep_research_followup tool
 */
const FollowUpInputSchema = z.object({
  interactionId: z
    .string()
    .min(1, 'Interaction ID is required')
    .describe('The interaction ID from a previous deep_research call'),
  question: z
    .string()
    .min(1, 'Question is required')
    .max(2000, 'Question must be less than 2000 characters')
    .describe('A follow-up question about the research results'),
});

type FollowUpInput = z.infer<typeof FollowUpInputSchema>;

/**
 * Gemini Deep Research MCP Server
 *
 * Provides tools for conducting deep research using Google's Deep Research Agent.
 * The agent autonomously searches the web, reads sources, and synthesizes findings
 * into detailed, cited reports.
 */
export class GeminiDeepResearchMcpServer extends McpServer {
  private client: GeminiClient | null = null;
  private initError: string | null = null;

  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  /**
   * Initialize the MCP server
   */
  async initialize(): Promise<void> {
    if (!this.apiKeyConfig?.apiKey) {
      this.initError =
        'Gemini API key is not configured. Please configure the API key in the MCP server settings.';
      console.warn('[GeminiDeepResearch] No API key configured');
      return;
    }

    try {
      this.client = new GeminiClient(this.apiKeyConfig.apiKey);
      this.initError = null;
    } catch (error) {
      this.initError = `Failed to initialize Gemini client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[GeminiDeepResearch] Initialization error:', error);
    }
  }

  /**
   * Validate the API key against the Google Gemini API
   * Actually calls the API to verify the key is valid
   */
  override async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKeyConfig?.apiKey) {
      return { valid: false, error: 'API key not configured' };
    }

    try {
      const client = new GeminiClient(this.apiKeyConfig.apiKey);
      const result = await client.validateApiKey();
      console.log('[GeminiDeepResearch] API key validation:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[GeminiDeepResearch] Validation error:', errorMessage);
      return { valid: false, error: `Validation failed: ${errorMessage}` };
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<McpTool[]> {
    return [
      {
        name: 'deep_research',
        description:
          'Conducts comprehensive, multi-step research using Google\'s Deep Research Agent. ' +
          'The agent autonomously searches the web, reads multiple sources, and synthesizes findings ' +
          'into detailed, cited reports. Research tasks typically take 5-20 minutes to complete. ' +
          'Cost: ~$2-5 per research task. ' +
          'Best for: market analysis, technical research, literature reviews, competitive landscaping, ' +
          'due diligence, and any topic requiring thorough investigation.',
        inputSchema: DeepResearchInputSchema,
      },
      {
        name: 'deep_research_followup',
        description:
          'Ask a follow-up question about a completed research. ' +
          'Use the interactionId returned from a previous deep_research call. ' +
          'Useful for clarification, summarization, or elaboration on specific sections.',
        inputSchema: FollowUpInputSchema,
      },
    ];
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: unknown): Promise<unknown> {
    // Check if API key is configured
    if (!this.client) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'API_KEY_REQUIRED',
              message:
                this.initError ||
                'Gemini API key is not configured. Please configure the API key in the MCP server settings.',
              configurationHint: 'Go to MCP Servers > Gemini Deep Research > Configure API Key',
            }),
          },
        ],
        isError: true,
      };
    }

    switch (name) {
      case 'deep_research':
        return this.handleDeepResearch(args);
      case 'deep_research_followup':
        return this.handleFollowUp(args);
      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'UNKNOWN_TOOL',
                message: `Unknown tool: ${name}. Available tools: deep_research, deep_research_followup`,
              }),
            },
          ],
          isError: true,
        };
    }
  }

  /**
   * Handle deep_research tool call
   */
  private async handleDeepResearch(args: unknown): Promise<unknown> {
    // Validate input
    let input: DeepResearchInput;
    try {
      input = DeepResearchInputSchema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'INVALID_INPUT',
                message: 'Invalid input parameters',
                details: error.issues.map((issue) => ({
                  path: issue.path.join('.'),
                  message: issue.message,
                })),
              }),
            },
          ],
          isError: true,
        };
      }
      throw error;
    }

    try {
      const result = await this.client!.deepResearch(input);

      if (result.status === 'failed') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'RESEARCH_FAILED',
                message: result.error || 'Research failed',
                interactionId: result.interactionId,
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: result.content,
          },
        ],
        metadata: {
          interactionId: result.interactionId,
          citations: result.citations,
          status: result.status,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Handle deep_research_followup tool call
   */
  private async handleFollowUp(args: unknown): Promise<unknown> {
    // Validate input
    let input: FollowUpInput;
    try {
      input = FollowUpInputSchema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'INVALID_INPUT',
                message: 'Invalid input parameters',
                details: error.issues.map((issue) => ({
                  path: issue.path.join('.'),
                  message: issue.message,
                })),
              }),
            },
          ],
          isError: true,
        };
      }
      throw error;
    }

    try {
      const result = await this.client!.followUp(input.interactionId, input.question);

      return {
        content: [
          {
            type: 'text',
            text: result.content,
          },
        ],
        metadata: {
          interactionId: result.interactionId,
          status: result.status,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Handle API errors with specific error messages
   */
  private handleApiError(error: unknown): unknown {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific API errors
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'INVALID_API_KEY',
              message:
                'Invalid or expired Gemini API key. Please check your API key configuration.',
            }),
          },
        ],
        isError: true,
      };
    }

    if (errorMessage.includes('429')) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'RATE_LIMITED',
              message: 'Rate limit exceeded. Please try again in a few moments.',
            }),
          },
        ],
        isError: true,
      };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'TIMEOUT',
              message: 'Research timed out. The topic may require more time than allowed.',
            }),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'RESEARCH_FAILED',
            message: `Research failed: ${errorMessage}`,
          }),
        },
      ],
      isError: true,
    };
  }

  /**
   * List available resources (none for this MCP)
   */
  async listResources(): Promise<McpResource[]> {
    return [];
  }

  /**
   * Read a resource (not supported)
   */
  async readResource(_uri: string): Promise<unknown> {
    throw new Error('No resources available in Gemini Deep Research MCP');
  }
}
