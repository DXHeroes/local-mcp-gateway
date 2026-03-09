/**
 * Unit tests for GeminiClient
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiClient, extractCitations, extractTextFromContent } from '../src/gemini-client.js';

// Mock functions at module level so they persist across instances
const mockInteractionsCreate = vi.fn();
const mockInteractionsGet = vi.fn();
const mockModelsList = vi.fn();

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      interactions = {
        create: mockInteractionsCreate,
        get: mockInteractionsGet,
      };
      models = {
        list: mockModelsList,
      };
    },
  };
});

// Helper to get the mock functions
function getMocks() {
  return {
    interactions: {
      create: mockInteractionsCreate,
      get: mockInteractionsGet,
    },
    models: {
      list: mockModelsList,
    },
  };
}

describe('extractTextFromContent', () => {
  it('should extract text from TextContent', () => {
    expect(extractTextFromContent({ type: 'text', text: 'hello world' })).toBe('hello world');
  });

  it('should return empty string for non-text content', () => {
    expect(extractTextFromContent({ type: 'image' })).toBe('');
  });

  it('should return empty string when text is undefined', () => {
    expect(extractTextFromContent({ type: 'text' })).toBe('');
  });
});

describe('extractCitations', () => {
  it('should extract source from annotations', () => {
    const result = {
      id: 'test-id',
      status: 'completed' as const,
      outputs: [
        {
          type: 'text',
          text: 'Some research content',
          annotations: [
            { source: 'https://example.com/article1', start_index: 0, end_index: 10 },
            { source: 'https://example.com/article2', start_index: 20, end_index: 30 },
          ],
        },
      ],
    };

    const citations = extractCitations(result);
    expect(citations).toEqual(['https://example.com/article1', 'https://example.com/article2']);
  });

  it('should handle missing annotations', () => {
    const result = {
      id: 'test-id',
      status: 'completed' as const,
      outputs: [{ type: 'text', text: 'No citations here' }],
    };

    expect(extractCitations(result)).toEqual([]);
  });

  it('should handle empty outputs', () => {
    const result = {
      id: 'test-id',
      status: 'completed' as const,
      outputs: [],
    };

    expect(extractCitations(result)).toEqual([]);
  });

  it('should handle missing outputs', () => {
    const result = {
      id: 'test-id',
      status: 'completed' as const,
    };

    expect(extractCitations(result)).toEqual([]);
  });

  it('should deduplicate citations', () => {
    const result = {
      id: 'test-id',
      status: 'completed' as const,
      outputs: [
        {
          type: 'text',
          text: 'Content',
          annotations: [
            { source: 'https://example.com/same' },
            { source: 'https://example.com/same' },
            { source: 'https://example.com/different' },
          ],
        },
      ],
    };

    const citations = extractCitations(result);
    expect(citations).toEqual(['https://example.com/same', 'https://example.com/different']);
  });

  it('should skip annotations without source', () => {
    const result = {
      id: 'test-id',
      status: 'completed' as const,
      outputs: [
        {
          type: 'text',
          text: 'Content',
          annotations: [{ start_index: 0, end_index: 10 }, { source: 'https://example.com/valid' }],
        },
      ],
    };

    expect(extractCitations(result)).toEqual(['https://example.com/valid']);
  });

  it('should skip non-text outputs', () => {
    const result = {
      id: 'test-id',
      status: 'completed' as const,
      outputs: [
        { type: 'image' },
        {
          type: 'text',
          text: 'Content',
          annotations: [{ source: 'https://example.com' }],
        },
      ],
    };

    expect(extractCitations(result)).toEqual(['https://example.com']);
  });
});

describe('GeminiClient', () => {
  let client: GeminiClient;
  let mocks: ReturnType<typeof getMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GeminiClient('test-api-key');
    mocks = getMocks();
  });

  describe('validateApiKey', () => {
    it('should return valid: true for a valid key', async () => {
      // Mock async iterator
      mocks.models.list.mockResolvedValue({
        async *[Symbol.asyncIterator]() {
          yield { name: 'models/gemini-pro' };
        },
      });

      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid for 401 error', async () => {
      mocks.models.list.mockRejectedValue(new Error('401 Unauthorized'));

      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Invalid API key' });
    });

    it('should return invalid for 403 error', async () => {
      mocks.models.list.mockRejectedValue(new Error('403 PERMISSION_DENIED'));

      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Invalid API key' });
    });

    it('should return validation failed for network errors', async () => {
      mocks.models.list.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Validation failed: ECONNREFUSED' });
    });
  });

  describe('deepResearch', () => {
    it('should pass store: true to interactions.create', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'completed',
        outputs: [{ type: 'text', text: 'Research results' }],
      });

      await client.deepResearch({ topic: 'test topic' });

      expect(mocks.interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          store: true,
          background: true,
          agent: 'deep-research-pro-preview-12-2025',
        })
      );
    });

    it('should append format instructions to the prompt', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'completed',
        outputs: [{ type: 'text', text: 'Formatted results' }],
      });

      await client.deepResearch({
        topic: 'AI impact',
        formatInstructions: 'Format as bullet points',
      });

      expect(mocks.interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          input: 'AI impact\n\nFormat as bullet points',
        })
      );
    });

    it('should return completed result with content and citations', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'completed',
        outputs: [
          {
            type: 'text',
            text: 'Research findings',
            annotations: [{ source: 'https://source.com' }],
          },
        ],
      });

      const result = await client.deepResearch({ topic: 'test' });

      expect(result).toEqual({
        content: 'Research findings',
        interactionId: 'interaction-1',
        citations: ['https://source.com'],
        status: 'completed',
      });
    });

    it('should poll until completion', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      // First poll: in_progress, second poll: completed
      mocks.interactions.get
        .mockResolvedValueOnce({
          id: 'interaction-1',
          status: 'in_progress',
        })
        .mockResolvedValueOnce({
          id: 'interaction-1',
          status: 'completed',
          outputs: [{ type: 'text', text: 'Done' }],
        });

      // Mock setTimeout to resolve immediately
      vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      });

      const result = await client.deepResearch({ topic: 'test' });
      expect(result.status).toBe('completed');
      expect(mocks.interactions.get).toHaveBeenCalledTimes(2);

      vi.restoreAllMocks();
    });

    it('should return failed result on failure status', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'failed',
      });

      const result = await client.deepResearch({ topic: 'test' });

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should handle cancelled status', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'cancelled',
      });

      const result = await client.deepResearch({ topic: 'test' });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('cancelled');
    });

    it('should handle requires_action status', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'requires_action',
      });

      const result = await client.deepResearch({ topic: 'test' });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('requires action');
    });

    it('should throw on timeout', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      // Mock setTimeout to resolve immediately (no real delay)
      vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      });

      // Mock Date.now to jump past 60 minutes after the first get call
      const realDateNow = Date.now;
      let callCount = 0;
      const startTime = realDateNow();
      vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        // After a few calls, jump past 60 minutes
        if (callCount > 4) {
          return startTime + 61 * 60 * 1000;
        }
        return startTime;
      });

      await expect(client.deepResearch({ topic: 'test' })).rejects.toThrow(
        'Research timed out after 60 minutes'
      );

      vi.restoreAllMocks();
    });

    it('should find the last text content in outputs', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'interaction-1',
        status: 'in_progress',
      });

      mocks.interactions.get.mockResolvedValue({
        id: 'interaction-1',
        status: 'completed',
        outputs: [
          { type: 'text', text: 'First draft' },
          { type: 'image' },
          { type: 'text', text: 'Final version' },
        ],
      });

      const result = await client.deepResearch({ topic: 'test' });
      expect(result.content).toBe('Final version');
    });
  });

  describe('followUp', () => {
    it('should use model parameter instead of agent', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'followup-1',
        status: 'completed',
        outputs: [{ type: 'text', text: 'Follow-up answer' }],
      });

      await client.followUp('prev-interaction-id', 'What about X?');

      expect(mocks.interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-pro',
          previous_interaction_id: 'prev-interaction-id',
          input: 'What about X?',
        })
      );

      // Should NOT have agent parameter
      const callArgs = mocks.interactions.create.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('agent');
    });

    it('should return content from follow-up response', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'followup-1',
        status: 'completed',
        outputs: [{ type: 'text', text: 'The answer is 42' }],
      });

      const result = await client.followUp('prev-id', 'What is the meaning?');

      expect(result).toEqual({
        content: 'The answer is 42',
        interactionId: 'followup-1',
        status: 'completed',
      });
    });

    it('should handle empty outputs', async () => {
      mocks.interactions.create.mockResolvedValue({
        id: 'followup-1',
        status: 'completed',
        outputs: [],
      });

      const result = await client.followUp('prev-id', 'Question');
      expect(result.content).toBe('');
    });
  });
});
