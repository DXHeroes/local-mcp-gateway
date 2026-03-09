/**
 * Toggl Track API client — thin HTTP wrapper around fetch
 *
 * Auth: HTTP Basic — base64(apiToken:api_token)
 * Track API: https://api.track.toggl.com/api/v9
 * Reports API: https://api.track.toggl.com/reports/api/v3
 * Rate limit: 1 req/sec per IP per token
 */

export type TogglErrorCode =
  | 'INVALID_API_KEY'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'API_ERROR';

export class TogglApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: TogglErrorCode
  ) {
    super(`${code}: ${message}`);
    this.name = 'TogglApiError';
  }
}

export class TogglClient {
  private readonly authHeader: string;
  private readonly trackBaseUrl: string;
  private readonly reportsBaseUrl: string;

  constructor(
    apiToken: string,
    trackBaseUrl = 'https://api.track.toggl.com/api/v9',
    reportsBaseUrl = 'https://api.track.toggl.com/reports/api/v3'
  ) {
    const encoded = Buffer.from(`${apiToken}:api_token`).toString('base64');
    this.authHeader = `Basic ${encoded}`;
    this.trackBaseUrl = trackBaseUrl;
    this.reportsBaseUrl = reportsBaseUrl;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private buildUrl(
    baseUrl: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = `${baseUrl}${path}`;
    if (!params) return url;
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    return qs ? `${url}?${qs}` : url;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    baseUrl: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    const url = this.buildUrl(baseUrl, path, params);
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
    };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    // DELETE returns 200 with no body
    if (method === 'DELETE' && response.ok) {
      return undefined as T;
    }

    if (!response.ok) {
      const code = this.mapStatusToCode(response.status);
      let message: string;
      try {
        const errorBody = await response.text();
        message = errorBody || response.statusText;
      } catch {
        message = response.statusText;
      }
      throw new TogglApiError(message, response.status, code);
    }

    // Some endpoints return empty body on success
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private mapStatusToCode(status: number): TogglErrorCode {
    if (status === 401 || status === 403) return 'INVALID_API_KEY';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 400) return 'BAD_REQUEST';
    return 'API_ERROR';
  }

  private track<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    return this.request<T>(method, this.trackBaseUrl, path, params, body);
  }

  private report<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', this.reportsBaseUrl, path, undefined, body);
  }

  // ── Validation ───────────────────────────────────────────────────────

  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.track('GET', '/me');
      return { valid: true };
    } catch (error) {
      if (error instanceof TogglApiError && error.code === 'INVALID_API_KEY') {
        return { valid: false, error: 'Invalid API token' };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Validation failed: ${message}` };
    }
  }

  // ── User & Workspace ────────────────────────────────────────────────

  async me(params: { with_related_data?: boolean }): Promise<unknown> {
    return this.track('GET', '/me', params as Record<string, boolean | undefined>);
  }

  async listWorkspaces(): Promise<unknown> {
    return this.track('GET', '/me/workspaces');
  }

  async getWorkspace(params: { workspace_id: number }): Promise<unknown> {
    return this.track('GET', `/workspaces/${params.workspace_id}`);
  }

  // ── Time Entries ────────────────────────────────────────────────────

  async listTimeEntries(params: { start_date?: string; end_date?: string }): Promise<unknown> {
    return this.track('GET', '/me/time_entries', params as Record<string, string | undefined>);
  }

  async getCurrentTimeEntry(): Promise<unknown> {
    return this.track('GET', '/me/time_entries/current');
  }

  async createTimeEntry(params: {
    workspace_id: number;
    description?: string;
    project_id?: number;
    start: string;
    duration: number;
    tags?: string[];
    billable?: boolean;
    created_with: string;
  }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.track('POST', `/workspaces/${workspace_id}/time_entries`, undefined, {
      workspace_id,
      ...body,
    });
  }

  async updateTimeEntry(params: {
    workspace_id: number;
    time_entry_id: number;
    description?: string;
    project_id?: number | null;
    start?: string;
    duration?: number;
    tags?: string[];
    billable?: boolean;
  }): Promise<unknown> {
    const { workspace_id, time_entry_id, ...body } = params;
    return this.track(
      'PUT',
      `/workspaces/${workspace_id}/time_entries/${time_entry_id}`,
      undefined,
      body
    );
  }

  async stopTimeEntry(params: { workspace_id: number; time_entry_id: number }): Promise<unknown> {
    return this.track(
      'PATCH',
      `/workspaces/${params.workspace_id}/time_entries/${params.time_entry_id}/stop`
    );
  }

  async deleteTimeEntry(params: { workspace_id: number; time_entry_id: number }): Promise<unknown> {
    return this.track(
      'DELETE',
      `/workspaces/${params.workspace_id}/time_entries/${params.time_entry_id}`
    );
  }

  // ── Projects ────────────────────────────────────────────────────────

  async listProjects(params: {
    workspace_id: number;
    active?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<unknown> {
    const { workspace_id, ...query } = params;
    return this.track(
      'GET',
      `/workspaces/${workspace_id}/projects`,
      query as Record<string, string | number | boolean | undefined>
    );
  }

  async getProject(params: { workspace_id: number; project_id: number }): Promise<unknown> {
    return this.track('GET', `/workspaces/${params.workspace_id}/projects/${params.project_id}`);
  }

  async createProject(params: {
    workspace_id: number;
    name: string;
    client_id?: number;
    active?: boolean;
    billable?: boolean;
    color?: string;
  }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.track('POST', `/workspaces/${workspace_id}/projects`, undefined, body);
  }

  async updateProject(params: {
    workspace_id: number;
    project_id: number;
    name?: string;
    client_id?: number | null;
    active?: boolean;
    billable?: boolean;
    color?: string;
  }): Promise<unknown> {
    const { workspace_id, project_id, ...body } = params;
    return this.track('PUT', `/workspaces/${workspace_id}/projects/${project_id}`, undefined, body);
  }

  // ── Clients ─────────────────────────────────────────────────────────

  async listClients(params: {
    workspace_id: number;
    status?: string;
    name?: string;
  }): Promise<unknown> {
    const { workspace_id, ...query } = params;
    return this.track(
      'GET',
      `/workspaces/${workspace_id}/clients`,
      query as Record<string, string | undefined>
    );
  }

  async createClient(params: {
    workspace_id: number;
    name: string;
    notes?: string;
  }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.track('POST', `/workspaces/${workspace_id}/clients`, undefined, body);
  }

  async updateClient(params: {
    workspace_id: number;
    client_id: number;
    name?: string;
    notes?: string;
  }): Promise<unknown> {
    const { workspace_id, client_id, ...body } = params;
    return this.track('PUT', `/workspaces/${workspace_id}/clients/${client_id}`, undefined, body);
  }

  // ── Tags ────────────────────────────────────────────────────────────

  async listTags(params: { workspace_id: number }): Promise<unknown> {
    return this.track('GET', `/workspaces/${params.workspace_id}/tags`);
  }

  async createTag(params: { workspace_id: number; name: string }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.track('POST', `/workspaces/${workspace_id}/tags`, undefined, body);
  }

  // ── Reports ─────────────────────────────────────────────────────────

  async reportSummary(params: {
    workspace_id: number;
    start_date: string;
    end_date: string;
    grouping?: string;
    sub_grouping?: string;
    user_ids?: number[];
    project_ids?: number[];
    client_ids?: number[];
    tag_ids?: number[];
    billable?: boolean;
  }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.report(`/workspace/${workspace_id}/summary/time_entries`, body);
  }

  async reportDetailed(params: {
    workspace_id: number;
    start_date: string;
    end_date: string;
    user_ids?: number[];
    project_ids?: number[];
    client_ids?: number[];
    tag_ids?: number[];
    billable?: boolean;
    page_size?: number;
    first_row_number?: number;
  }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.report(`/workspace/${workspace_id}/search/time_entries`, body);
  }

  async reportWeekly(params: {
    workspace_id: number;
    start_date: string;
    end_date: string;
    user_ids?: number[];
    project_ids?: number[];
    client_ids?: number[];
    tag_ids?: number[];
    billable?: boolean;
  }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.report(`/workspace/${workspace_id}/weekly/time_entries`, body);
  }

  async reportProjectSummary(params: {
    workspace_id: number;
    start_date: string;
    end_date: string;
  }): Promise<unknown> {
    const { workspace_id, ...body } = params;
    return this.report(`/workspace/${workspace_id}/projects/summary`, body);
  }
}
