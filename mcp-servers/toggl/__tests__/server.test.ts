/**
 * Unit tests for TogglMcpServer
 */

import type { ApiKeyConfig } from '@dxheroes/local-mcp-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TogglMcpServer } from '../src/server.js';

// Mock the TogglClient
const mockValidateApiKey = vi.fn();
const mockMe = vi.fn();
const mockListWorkspaces = vi.fn();
const mockGetWorkspace = vi.fn();
const mockListTimeEntries = vi.fn();
const mockGetCurrentTimeEntry = vi.fn();
const mockCreateTimeEntry = vi.fn();
const mockUpdateTimeEntry = vi.fn();
const mockStopTimeEntry = vi.fn();
const mockDeleteTimeEntry = vi.fn();
const mockListProjects = vi.fn();
const mockGetProject = vi.fn();
const mockCreateProject = vi.fn();
const mockUpdateProject = vi.fn();
const mockListClients = vi.fn();
const mockCreateClient = vi.fn();
const mockUpdateClient = vi.fn();
const mockListTags = vi.fn();
const mockCreateTag = vi.fn();
const mockReportSummary = vi.fn();
const mockReportDetailed = vi.fn();
const mockReportWeekly = vi.fn();
const mockReportProjectSummary = vi.fn();

vi.mock('../src/client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/client.js')>();
  return {
    ...original,
    TogglClient: class MockTogglClient {
      validateApiKey = mockValidateApiKey;
      me = mockMe;
      listWorkspaces = mockListWorkspaces;
      getWorkspace = mockGetWorkspace;
      listTimeEntries = mockListTimeEntries;
      getCurrentTimeEntry = mockGetCurrentTimeEntry;
      createTimeEntry = mockCreateTimeEntry;
      updateTimeEntry = mockUpdateTimeEntry;
      stopTimeEntry = mockStopTimeEntry;
      deleteTimeEntry = mockDeleteTimeEntry;
      listProjects = mockListProjects;
      getProject = mockGetProject;
      createProject = mockCreateProject;
      updateProject = mockUpdateProject;
      listClients = mockListClients;
      createClient = mockCreateClient;
      updateClient = mockUpdateClient;
      listTags = mockListTags;
      createTag = mockCreateTag;
      reportSummary = mockReportSummary;
      reportDetailed = mockReportDetailed;
      reportWeekly = mockReportWeekly;
      reportProjectSummary = mockReportProjectSummary;
    },
  };
});

describe('TogglMcpServer', () => {
  const apiKeyConfig: ApiKeyConfig = {
    apiKey: 'test-toggl-token',
    headerName: 'Authorization',
    headerValue: 'Basic dGVzdC10b2dnbC10b2tlbjphcGlfdG9rZW4=',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with valid API key', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();

      mockMe.mockResolvedValue({ id: 1 });
      const result = (await server.callTool('toggl_me', {})) as { isError?: boolean };
      expect(result.isError).toBeUndefined();
    });

    it('should set error when no API key is provided', async () => {
      const server = new TogglMcpServer(null);
      await server.initialize();

      const result = (await server.callTool('toggl_me', {})) as {
        isError: boolean;
        content: Array<{ text: string }>;
      };
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_KEY_REQUIRED');
    });

    it('should set error when API key is empty', async () => {
      const server = new TogglMcpServer({ ...apiKeyConfig, apiKey: '' });
      await server.initialize();

      const result = (await server.callTool('toggl_me', {})) as { isError: boolean };
      expect(result.isError).toBe(true);
    });
  });

  describe('validate', () => {
    it('should delegate to TogglClient.validateApiKey', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();

      mockValidateApiKey.mockResolvedValue({ valid: true });
      const result = await server.validate();
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid when no API key configured', async () => {
      const server = new TogglMcpServer(null);
      await server.initialize();

      const result = await server.validate();
      expect(result).toEqual({ valid: false, error: 'API token not configured' });
    });
  });

  describe('listTools', () => {
    it('should return 22 tools', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      expect(tools).toHaveLength(22);
    });

    it('should have correct tool names', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      const names = tools.map((t) => t.name);

      // User & Workspace
      expect(names).toContain('toggl_me');
      expect(names).toContain('toggl_list_workspaces');
      expect(names).toContain('toggl_get_workspace');

      // Time Entries
      expect(names).toContain('toggl_list_time_entries');
      expect(names).toContain('toggl_get_current_time_entry');
      expect(names).toContain('toggl_create_time_entry');
      expect(names).toContain('toggl_update_time_entry');
      expect(names).toContain('toggl_stop_time_entry');
      expect(names).toContain('toggl_delete_time_entry');

      // Projects
      expect(names).toContain('toggl_list_projects');
      expect(names).toContain('toggl_get_project');
      expect(names).toContain('toggl_create_project');
      expect(names).toContain('toggl_update_project');

      // Clients
      expect(names).toContain('toggl_list_clients');
      expect(names).toContain('toggl_create_client');
      expect(names).toContain('toggl_update_client');

      // Tags
      expect(names).toContain('toggl_list_tags');
      expect(names).toContain('toggl_create_tag');

      // Reports
      expect(names).toContain('toggl_report_summary');
      expect(names).toContain('toggl_report_detailed');
      expect(names).toContain('toggl_report_weekly');
      expect(names).toContain('toggl_report_project_summary');
    });

    it('should have inputSchema on each tool', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
      }
    });

    it('should have description on each tool', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
      }
    });
  });

  describe('callTool - toggl_me', () => {
    let server: TogglMcpServer;

    beforeEach(async () => {
      server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return user data on success', async () => {
      mockMe.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const result = (await server.callTool('toggl_me', {})) as {
        content: Array<{ type: string; text: string }>;
      };

      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe(1);
    });
  });

  describe('callTool - toggl_create_time_entry', () => {
    let server: TogglMcpServer;

    beforeEach(async () => {
      server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should create time entry', async () => {
      mockCreateTimeEntry.mockResolvedValue({ id: 100, description: 'Working' });

      const result = (await server.callTool('toggl_create_time_entry', {
        workspace_id: 42,
        description: 'Working',
        start: '2024-01-01T09:00:00Z',
        duration: 3600,
      })) as { content: Array<{ text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe(100);
    });

    it('should return error for invalid input', async () => {
      const result = (await server.callTool('toggl_create_time_entry', {})) as {
        isError: boolean;
        content: Array<{ text: string }>;
      };
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('INVALID_INPUT');
    });
  });

  describe('callTool - toggl_report_summary', () => {
    let server: TogglMcpServer;

    beforeEach(async () => {
      server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return summary report', async () => {
      mockReportSummary.mockResolvedValue({ groups: [{ id: 1 }] });

      const result = (await server.callTool('toggl_report_summary', {
        workspace_id: 42,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })) as { content: Array<{ text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.groups).toHaveLength(1);
    });
  });

  describe('callTool - toggl_list_projects', () => {
    let server: TogglMcpServer;

    beforeEach(async () => {
      server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should list projects', async () => {
      mockListProjects.mockResolvedValue([{ id: 1, name: 'Project A' }]);

      const result = (await server.callTool('toggl_list_projects', {
        workspace_id: 42,
      })) as { content: Array<{ text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveLength(1);
    });
  });

  describe('callTool - unknown tool', () => {
    it('should return error for unknown tool name', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
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

  describe('callTool - API error handling', () => {
    let server: TogglMcpServer;

    beforeEach(async () => {
      server = new TogglMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should handle TogglApiError with INVALID_API_KEY code', async () => {
      const { TogglApiError } = await import('../src/client.js');
      mockMe.mockRejectedValue(new TogglApiError('Unauthorized', 401, 'INVALID_API_KEY'));

      const result = (await server.callTool('toggl_me', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('INVALID_API_KEY');
    });

    it('should handle TogglApiError with RATE_LIMITED code', async () => {
      const { TogglApiError } = await import('../src/client.js');
      mockMe.mockRejectedValue(new TogglApiError('Too many', 429, 'RATE_LIMITED'));

      const result = (await server.callTool('toggl_me', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('RATE_LIMITED');
    });

    it('should handle TogglApiError with NOT_FOUND code', async () => {
      const { TogglApiError } = await import('../src/client.js');
      mockGetWorkspace.mockRejectedValue(new TogglApiError('Not found', 404, 'NOT_FOUND'));

      const result = (await server.callTool('toggl_get_workspace', {
        workspace_id: 999,
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('NOT_FOUND');
    });

    it('should handle generic errors', async () => {
      mockMe.mockRejectedValue(new Error('Network error'));

      const result = (await server.callTool('toggl_me', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_ERROR');
    });
  });

  describe('listResources', () => {
    it('should return empty array', async () => {
      const server = new TogglMcpServer(apiKeyConfig);
      const resources = await server.listResources();
      expect(resources).toEqual([]);
    });
  });
});
