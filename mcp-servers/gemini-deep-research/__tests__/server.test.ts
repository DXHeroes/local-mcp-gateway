/**
 * Unit tests for GeminiDeepResearchMcpServer
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiKeyConfig } from '@dxheroes/local-mcp-core';
import { GeminiDeepResearchMcpServer } from '../src/server.js';
import type { DeepResearchResult } from '../src/gemini-client.js';

// Mock the GeminiClient
const mockValidateApiKey = vi.fn();
const mockDeepResearch = vi.fn();
const mockFollowUp = vi.fn();

vi.mock('../src/gemini-client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/gemini-client.js')>();
  return {
    ...original,
    GeminiClient: class MockGeminiClient {
      validateApiKey = mockValidateApiKey;
      deepResearch = mockDeepResearch;
      followUp = mockFollowUp;
    },
  };
});

describe('GeminiDeepResearchMcpServer', () => {
  const apiKeyConfig: ApiKeyConfig = {
    apiKey: 'test-key-123',
    headerName: 'x-goog-api-key',
    headerValue: 'test-key-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with valid API key', async () => {
      const server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      await server.initialize();

      // Should be able to call tools without API_KEY_REQUIRED error
      mockDeepResearch.mockResolvedValue({
        content: 'result',
        interactionId: 'id',
        status: 'completed',
      });
      const result = (await server.callTool('deep_research', {
        topic: 'test',
      })) as { isError?: boolean };
      expect(result.isError).toBeUndefined();
    });

    it('should set error when no API key is provided', async () => {
      const server = new GeminiDeepResearchMcpServer(null);
      await server.initialize();

      const result = (await server.callTool('deep_research', { topic: 'test' })) as {
        isError: boolean;
        content: Array<{ text: string }>;
      };
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_KEY_REQUIRED');
    });

    it('should set error when API key is empty', async () => {
      const server = new GeminiDeepResearchMcpServer({
        ...apiKeyConfig,
        apiKey: '',
      });
      await server.initialize();

      const result = (await server.callTool('deep_research', { topic: 'test' })) as {
        isError: boolean;
      };
      expect(result.isError).toBe(true);
    });
  });

  describe('validate', () => {
    it('should delegate to GeminiClient.validateApiKey', async () => {
      const server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      await server.initialize();

      mockValidateApiKey.mockResolvedValue({ valid: true });

      const result = await server.validate();
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid when no API key configured', async () => {
      const server = new GeminiDeepResearchMcpServer(null);
      await server.initialize();

      const result = await server.validate();
      expect(result).toEqual({ valid: false, error: 'API key not configured' });
    });
  });

  describe('listTools', () => {
    it('should return deep_research and deep_research_followup tools', async () => {
      const server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();

      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('deep_research');
      expect(tools[1].name).toBe('deep_research_followup');
    });

    it('should have inputSchema on each tool', async () => {
      const server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();

      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
      }
    });
  });

  describe('callTool - deep_research', () => {
    let server: GeminiDeepResearchMcpServer;

    beforeEach(async () => {
      server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return research content on success', async () => {
      const mockResult: DeepResearchResult = {
        content: 'Research findings about AI',
        interactionId: 'interaction-123',
        citations: ['https://source.com'],
        status: 'completed',
      };
      mockDeepResearch.mockResolvedValue(mockResult);

      const result = (await server.callTool('deep_research', {
        topic: 'AI trends',
      })) as { content: Array<{ type: string; text: string }>; metadata: unknown };

      expect(result.content[0].text).toBe('Research findings about AI');
      expect(result.metadata).toEqual(
        expect.objectContaining({
          interactionId: 'interaction-123',
          citations: ['https://source.com'],
        })
      );
    });

    it('should return error for invalid input', async () => {
      const result = (await server.callTool('deep_research', {})) as { isError: boolean };
      expect(result.isError).toBe(true);
    });

    it('should return error for empty topic', async () => {
      const result = (await server.callTool('deep_research', { topic: '' })) as {
        isError: boolean;
      };
      expect(result.isError).toBe(true);
    });

    it('should return error when research fails', async () => {
      const mockResult: DeepResearchResult = {
        content: '',
        interactionId: 'interaction-123',
        status: 'failed',
        error: 'Research failed',
      };
      mockDeepResearch.mockResolvedValue(mockResult);

      const result = (await server.callTool('deep_research', {
        topic: 'test topic',
      })) as { isError: boolean };

      expect(result.isError).toBe(true);
    });

    it('should handle 401 API errors', async () => {
      mockDeepResearch.mockRejectedValue(new Error('401 Unauthorized'));

      const result = (await server.callTool('deep_research', {
        topic: 'test topic',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('INVALID_API_KEY');
    });

    it('should handle 429 rate limit errors', async () => {
      mockDeepResearch.mockRejectedValue(new Error('429 Too Many Requests'));

      const result = (await server.callTool('deep_research', {
        topic: 'test topic',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('RATE_LIMITED');
    });

    it('should handle timeout errors', async () => {
      mockDeepResearch.mockRejectedValue(new Error('Research Timeout after 60 minutes'));

      const result = (await server.callTool('deep_research', {
        topic: 'test topic',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('TIMEOUT');
    });
  });

  describe('callTool - deep_research_followup', () => {
    let server: GeminiDeepResearchMcpServer;

    beforeEach(async () => {
      server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return follow-up content on success', async () => {
      const mockResult: DeepResearchResult = {
        content: 'Follow-up answer',
        interactionId: 'followup-123',
        status: 'completed',
      };
      mockFollowUp.mockResolvedValue(mockResult);

      const result = (await server.callTool('deep_research_followup', {
        interactionId: 'prev-id',
        question: 'What about X?',
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toBe('Follow-up answer');
    });

    it('should return error for missing interactionId', async () => {
      const result = (await server.callTool('deep_research_followup', {
        question: 'What about X?',
      })) as { isError: boolean };

      expect(result.isError).toBe(true);
    });

    it('should return error for missing question', async () => {
      const result = (await server.callTool('deep_research_followup', {
        interactionId: 'prev-id',
      })) as { isError: boolean };

      expect(result.isError).toBe(true);
    });
  });

  describe('callTool - unknown tool', () => {
    it('should return error for unknown tool name', async () => {
      const server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      await server.initialize();

      const result = (await server.callTool('unknown_tool', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('UNKNOWN_TOOL');
    });
  });

  describe('listResources', () => {
    it('should return empty array', async () => {
      const server = new GeminiDeepResearchMcpServer(apiKeyConfig);
      const resources = await server.listResources();
      expect(resources).toEqual([]);
    });
  });
});
