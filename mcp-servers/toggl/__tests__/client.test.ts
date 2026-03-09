/**
 * Unit tests for TogglClient
 *
 * Tests mock global.fetch to verify HTTP requests are constructed correctly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TogglApiError, TogglClient } from '../src/client.js';

const mockFetch = vi.fn();

describe('TogglClient', () => {
  let client: TogglClient;
  const expectedAuth = `Basic ${Buffer.from('test-token:api_token').toString('base64')}`;

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    client = new TogglClient('test-token');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockResponse(data: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(data === undefined ? '' : JSON.stringify(data)),
    };
  }

  describe('constructor', () => {
    it('should compute Basic auth header from api token', () => {
      const c = new TogglClient('my-token');
      mockFetch.mockResolvedValue(mockResponse({ id: 1 }));
      c.me({});
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.track.toggl.com/api/v9'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from('my-token:api_token').toString('base64')}`,
          }),
        })
      );
    });

    it('should allow custom base URLs', () => {
      const c = new TogglClient('my-token', 'https://custom.api.com', 'https://custom.reports.com');
      mockFetch.mockResolvedValue(mockResponse({}));
      c.me({});
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://custom.api.com'),
        expect.any(Object)
      );
    });
  });

  describe('validateApiKey', () => {
    it('should return valid: true on 200 response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 123, email: 'test@test.com' }));
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/me',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: expectedAuth },
        })
      );
    });

    it('should return invalid on 403 response', async () => {
      mockFetch.mockResolvedValue(mockResponse('Forbidden', 403));
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Invalid API token' });
    });

    it('should return error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Validation failed: ECONNREFUSED' });
    });
  });

  // ── User & Workspace ────────────────────────────────────────────────

  describe('me', () => {
    it('should call GET /me', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 1, email: 'test@test.com' }));
      const result = await client.me({});
      expect(result).toEqual({ id: 1, email: 'test@test.com' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/me',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should pass with_related_data param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 1 }));
      await client.me({ with_related_data: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/me?with_related_data=true',
        expect.any(Object)
      );
    });
  });

  describe('listWorkspaces', () => {
    it('should call GET /me/workspaces', async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: 1, name: 'My Workspace' }]));
      const result = await client.listWorkspaces();
      expect(result).toEqual([{ id: 1, name: 'My Workspace' }]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/me/workspaces',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('getWorkspace', () => {
    it('should call GET /workspaces/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 42, name: 'Test WS' }));
      await client.getWorkspace({ workspace_id: 42 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  // ── Time Entries ────────────────────────────────────────────────────

  describe('listTimeEntries', () => {
    it('should call GET /me/time_entries', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.listTimeEntries({});
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/me/time_entries',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should pass date params', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.listTimeEntries({ start_date: '2024-01-01', end_date: '2024-01-31' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/me/time_entries?start_date=2024-01-01&end_date=2024-01-31',
        expect.any(Object)
      );
    });
  });

  describe('getCurrentTimeEntry', () => {
    it('should call GET /me/time_entries/current', async () => {
      mockFetch.mockResolvedValue(mockResponse(null));
      await client.getCurrentTimeEntry();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/me/time_entries/current',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('createTimeEntry', () => {
    it('should POST to /workspaces/{wid}/time_entries', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 1 }));
      await client.createTimeEntry({
        workspace_id: 42,
        description: 'Test',
        start: '2024-01-01T09:00:00Z',
        duration: 3600,
        created_with: 'mcp-toggl',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/time_entries',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"description":"Test"'),
        })
      );
    });
  });

  describe('updateTimeEntry', () => {
    it('should PUT to /workspaces/{wid}/time_entries/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 99 }));
      await client.updateTimeEntry({
        workspace_id: 42,
        time_entry_id: 99,
        description: 'Updated',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/time_entries/99',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"description":"Updated"'),
        })
      );
    });
  });

  describe('stopTimeEntry', () => {
    it('should PATCH to /workspaces/{wid}/time_entries/{id}/stop', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 99 }));
      await client.stopTimeEntry({ workspace_id: 42, time_entry_id: 99 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/time_entries/99/stop',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  describe('deleteTimeEntry', () => {
    it('should DELETE /workspaces/{wid}/time_entries/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse(undefined, 200));
      await client.deleteTimeEntry({ workspace_id: 42, time_entry_id: 99 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/time_entries/99',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ── Projects ────────────────────────────────────────────────────────

  describe('listProjects', () => {
    it('should call GET /workspaces/{wid}/projects', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.listProjects({ workspace_id: 42 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/projects',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should pass active and pagination params', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.listProjects({ workspace_id: 42, active: true, page: 2, per_page: 50 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('active=true'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object));
    });
  });

  describe('getProject', () => {
    it('should call GET /workspaces/{wid}/projects/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 10, name: 'Project' }));
      await client.getProject({ workspace_id: 42, project_id: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/projects/10',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('createProject', () => {
    it('should POST to /workspaces/{wid}/projects', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 10 }));
      await client.createProject({ workspace_id: 42, name: 'New Project' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/projects',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"New Project"'),
        })
      );
    });
  });

  describe('updateProject', () => {
    it('should PUT to /workspaces/{wid}/projects/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 10 }));
      await client.updateProject({ workspace_id: 42, project_id: 10, name: 'Renamed' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/projects/10',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"name":"Renamed"'),
        })
      );
    });
  });

  // ── Clients ─────────────────────────────────────────────────────────

  describe('listClients', () => {
    it('should call GET /workspaces/{wid}/clients', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.listClients({ workspace_id: 42 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/clients',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should pass status and name params', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.listClients({ workspace_id: 42, status: 'active', name: 'Acme' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('name=Acme'),
        expect.any(Object)
      );
    });
  });

  describe('createClient', () => {
    it('should POST to /workspaces/{wid}/clients', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 5 }));
      await client.createClient({ workspace_id: 42, name: 'Acme Corp' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/clients',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"Acme Corp"'),
        })
      );
    });
  });

  describe('updateClient', () => {
    it('should PUT to /workspaces/{wid}/clients/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 5 }));
      await client.updateClient({ workspace_id: 42, client_id: 5, name: 'Acme Inc' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/clients/5',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"name":"Acme Inc"'),
        })
      );
    });
  });

  // ── Tags ────────────────────────────────────────────────────────────

  describe('listTags', () => {
    it('should call GET /workspaces/{wid}/tags', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.listTags({ workspace_id: 42 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/tags',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('createTag', () => {
    it('should POST to /workspaces/{wid}/tags', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 1, name: 'urgent' }));
      await client.createTag({ workspace_id: 42, name: 'urgent' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/api/v9/workspaces/42/tags',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"urgent"'),
        })
      );
    });
  });

  // ── Reports ─────────────────────────────────────────────────────────

  describe('reportSummary', () => {
    it('should POST to reports /workspace/{wid}/summary/time_entries', async () => {
      mockFetch.mockResolvedValue(mockResponse({ groups: [] }));
      await client.reportSummary({
        workspace_id: 42,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/reports/api/v3/workspace/42/summary/time_entries',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"start_date":"2024-01-01"'),
        })
      );
    });

    it('should pass filters', async () => {
      mockFetch.mockResolvedValue(mockResponse({ groups: [] }));
      await client.reportSummary({
        workspace_id: 42,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        grouping: 'projects',
        project_ids: [1, 2],
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"grouping":"projects"'),
        })
      );
    });
  });

  describe('reportDetailed', () => {
    it('should POST to reports /workspace/{wid}/search/time_entries', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.reportDetailed({
        workspace_id: 42,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/reports/api/v3/workspace/42/search/time_entries',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('reportWeekly', () => {
    it('should POST to reports /workspace/{wid}/weekly/time_entries', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.reportWeekly({
        workspace_id: 42,
        start_date: '2024-01-01',
        end_date: '2024-01-07',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/reports/api/v3/workspace/42/weekly/time_entries',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('reportProjectSummary', () => {
    it('should POST to reports /workspace/{wid}/projects/summary', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await client.reportProjectSummary({
        workspace_id: 42,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.track.toggl.com/reports/api/v3/workspace/42/projects/summary',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ── Error handling ──────────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw INVALID_API_KEY on 401', async () => {
      mockFetch.mockResolvedValue(mockResponse('Unauthorized', 401));
      try {
        await client.me({});
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TogglApiError);
        expect((e as TogglApiError).code).toBe('INVALID_API_KEY');
        expect((e as TogglApiError).status).toBe(401);
      }
    });

    it('should throw INVALID_API_KEY on 403', async () => {
      mockFetch.mockResolvedValue(mockResponse('Forbidden', 403));
      try {
        await client.me({});
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TogglApiError);
        expect((e as TogglApiError).code).toBe('INVALID_API_KEY');
      }
    });

    it('should throw NOT_FOUND on 404', async () => {
      mockFetch.mockResolvedValue(mockResponse('Not found', 404));
      try {
        await client.getWorkspace({ workspace_id: 999 });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TogglApiError);
        expect((e as TogglApiError).code).toBe('NOT_FOUND');
      }
    });

    it('should throw RATE_LIMITED on 429', async () => {
      mockFetch.mockResolvedValue(mockResponse('Too many requests', 429));
      try {
        await client.me({});
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TogglApiError);
        expect((e as TogglApiError).code).toBe('RATE_LIMITED');
      }
    });

    it('should throw BAD_REQUEST on 400', async () => {
      mockFetch.mockResolvedValue(mockResponse('Bad request', 400));
      try {
        await client.createTimeEntry({
          workspace_id: 42,
          start: 'invalid',
          duration: -1,
          created_with: 'test',
        });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TogglApiError);
        expect((e as TogglApiError).code).toBe('BAD_REQUEST');
      }
    });

    it('should throw API_ERROR on 500', async () => {
      mockFetch.mockResolvedValue(mockResponse('Server error', 500));
      try {
        await client.me({});
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TogglApiError);
        expect((e as TogglApiError).code).toBe('API_ERROR');
      }
    });
  });
});
