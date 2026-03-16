/**
 * Fakturoid API v3 client — thin HTTP wrapper around fetch
 *
 * Auth: OAuth 2.0 Client Credentials flow
 * API: https://app.fakturoid.cz/api/v3/accounts/{slug}/
 * Docs: https://www.fakturoid.cz/api/v3
 * Rate limit: tracked via X-RateLimit-* headers
 */

export type FakturoidErrorCode =
  | 'INVALID_API_KEY'
  | 'TOKEN_EXCHANGE_FAILED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'UNPROCESSABLE'
  | 'API_ERROR';

export class FakturoidApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: FakturoidErrorCode
  ) {
    super(`${code}: ${message}`);
    this.name = 'FakturoidApiError';
  }
}

export class FakturoidClient {
  private readonly slug: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    apiKey: string,
    baseUrl = 'https://app.fakturoid.cz/api/v3',
    userAgent = 'LocalMcpGateway (support@dxheroes.io)'
  ) {
    const parts = apiKey.split(':');
    if (parts.length < 3) {
      throw new Error(
        'Invalid API key format. Expected "slug:client_id:client_secret". ' +
          'Get your OAuth credentials at Settings > User Account in your Fakturoid account.'
      );
    }
    const slug = parts[0];
    const clientId = parts[1];
    const clientSecret = parts.slice(2).join(':');

    if (!slug || !clientId || !clientSecret) {
      throw new Error(
        'Invalid API key format. Slug, client_id, and client_secret are all required. ' +
          'Format: "your-account-slug:your-client-id:your-client-secret"'
      );
    }

    this.slug = slug;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
  }

  // ── OAuth Token Exchange ───────────────────────────────────────────

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.cachedToken;
    }

    const tokenUrl = `${this.baseUrl}/oauth/token`;
    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      let message: string;
      try {
        const errorBody = await response.text();
        message = errorBody || response.statusText;
      } catch {
        message = response.statusText;
      }
      throw new FakturoidApiError(
        `OAuth token exchange failed: ${message}`,
        response.status,
        'TOKEN_EXCHANGE_FAILED'
      );
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return this.cachedToken;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = `${this.baseUrl}/accounts/${this.slug}/${path}`;
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
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${await this.getAccessToken()}`,
      'User-Agent': this.userAgent,
    };
    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    // DELETE returns 204 No Content
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
      throw new FakturoidApiError(message, response.status, code);
    }

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private mapStatusToCode(status: number): FakturoidErrorCode {
    if (status === 401 || status === 403) return 'INVALID_API_KEY';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 400) return 'BAD_REQUEST';
    if (status === 422) return 'UNPROCESSABLE';
    return 'API_ERROR';
  }

  // ── Validation ───────────────────────────────────────────────────────

  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.request('GET', 'account.json');
      return { valid: true };
    } catch (error) {
      if (error instanceof FakturoidApiError && error.code === 'INVALID_API_KEY') {
        return { valid: false, error: 'Invalid OAuth credentials or account slug' };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Validation failed: ${message}` };
    }
  }

  // ── Account ──────────────────────────────────────────────────────────

  async getAccount(): Promise<unknown> {
    return this.request('GET', 'account.json');
  }

  // ── Users & Bank Accounts ───────────────────────────────────────────

  async listUsers(): Promise<unknown> {
    return this.request('GET', 'users.json');
  }

  async listBankAccounts(): Promise<unknown> {
    return this.request('GET', 'bank_accounts.json');
  }

  // ── Invoices ─────────────────────────────────────────────────────────

  async listInvoices(params: {
    page?: number;
    since?: string;
    updated_since?: string;
    number?: string;
    status?: string;
    subject_id?: number;
  }): Promise<unknown> {
    return this.request(
      'GET',
      'invoices.json',
      params as Record<string, string | number | undefined>
    );
  }

  async getInvoice(params: { id: number }): Promise<unknown> {
    return this.request('GET', `invoices/${params.id}.json`);
  }

  async createInvoice(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', 'invoices.json', undefined, data);
  }

  async updateInvoice(params: { id: number }, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PATCH', `invoices/${params.id}.json`, undefined, data);
  }

  async invoiceAction(params: {
    id: number;
    event: string;
    paid_on?: string;
    paid_amount?: number;
  }): Promise<unknown> {
    const { id, event, ...body } = params;
    return this.request('POST', `invoices/${id}/fire.json`, { event }, body);
  }

  async searchInvoices(params: { query: string; page?: number }): Promise<unknown> {
    const { query, ...rest } = params;
    return this.request('GET', 'invoices/search.json', {
      query,
      ...rest,
    } as Record<string, string | number | undefined>);
  }

  async deleteInvoice(params: { id: number }): Promise<unknown> {
    return this.request('DELETE', `invoices/${params.id}.json`);
  }

  // ── Invoice Payments ───────────────────────────────────────────────

  async createPayment(params: {
    id: number;
    paid_on?: string;
    amount?: number;
    currency?: string;
    bank_account_id?: number;
  }): Promise<unknown> {
    const { id, ...body } = params;
    return this.request('POST', `invoices/${id}/payments.json`, undefined, body);
  }

  async deletePayment(params: {
    invoice_id: number;
    payment_id: number;
  }): Promise<unknown> {
    return this.request(
      'DELETE',
      `invoices/${params.invoice_id}/payments/${params.payment_id}.json`
    );
  }

  // ── Invoice Messages ───────────────────────────────────────────────

  async sendInvoiceMessage(params: {
    id: number;
    email: string;
    subject?: string;
    message?: string;
  }): Promise<unknown> {
    const { id, ...body } = params;
    return this.request('POST', `invoices/${id}/message.json`, undefined, body);
  }

  // ── Subjects (Contacts) ─────────────────────────────────────────────

  async listSubjects(params: {
    page?: number;
    since?: string;
    updated_since?: string;
  }): Promise<unknown> {
    return this.request(
      'GET',
      'subjects.json',
      params as Record<string, string | number | undefined>
    );
  }

  async getSubject(params: { id: number }): Promise<unknown> {
    return this.request('GET', `subjects/${params.id}.json`);
  }

  async createSubject(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', 'subjects.json', undefined, data);
  }

  async searchSubjects(params: { query: string; page?: number }): Promise<unknown> {
    return this.request('GET', 'subjects/search.json', params as Record<string, string | number>);
  }

  async updateSubject(params: { id: number }, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PATCH', `subjects/${params.id}.json`, undefined, data);
  }

  async deleteSubject(params: { id: number }): Promise<unknown> {
    return this.request('DELETE', `subjects/${params.id}.json`);
  }

  // ── Expenses ─────────────────────────────────────────────────────────

  async listExpenses(params: {
    page?: number;
    since?: string;
    status?: string;
    subject_id?: number;
  }): Promise<unknown> {
    return this.request(
      'GET',
      'expenses.json',
      params as Record<string, string | number | undefined>
    );
  }

  async createExpense(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', 'expenses.json', undefined, data);
  }

  async getExpense(params: { id: number }): Promise<unknown> {
    return this.request('GET', `expenses/${params.id}.json`);
  }

  async updateExpense(params: { id: number }, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PATCH', `expenses/${params.id}.json`, undefined, data);
  }

  async searchExpenses(params: { query: string; page?: number }): Promise<unknown> {
    return this.request('GET', 'expenses/search.json', params as Record<string, string | number>);
  }

  // ── Expense Payments ───────────────────────────────────────────────

  async createExpensePayment(params: {
    id: number;
    paid_on?: string;
    amount?: number;
    currency?: string;
  }): Promise<unknown> {
    const { id, ...body } = params;
    return this.request('POST', `expenses/${id}/payments.json`, undefined, body);
  }

  async deleteExpensePayment(params: {
    expense_id: number;
    payment_id: number;
  }): Promise<unknown> {
    return this.request(
      'DELETE',
      `expenses/${params.expense_id}/payments/${params.payment_id}.json`
    );
  }

  // ── Inventory Items ────────────────────────────────────────────────

  async listInventoryItems(params: { page?: number }): Promise<unknown> {
    return this.request(
      'GET',
      'inventory_items.json',
      params as Record<string, string | number | undefined>
    );
  }

  async getInventoryItem(params: { id: number }): Promise<unknown> {
    return this.request('GET', `inventory_items/${params.id}.json`);
  }

  async createInventoryItem(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', 'inventory_items.json', undefined, data);
  }

  async updateInventoryItem(
    params: { id: number },
    data: Record<string, unknown>
  ): Promise<unknown> {
    return this.request('PATCH', `inventory_items/${params.id}.json`, undefined, data);
  }

  async searchInventoryItems(params: { query: string; page?: number }): Promise<unknown> {
    return this.request(
      'GET',
      'inventory_items/search.json',
      params as Record<string, string | number>
    );
  }

  // ── Inventory Moves ────────────────────────────────────────────────

  async listInventoryMoves(params: {
    page?: number;
    since?: string;
    inventory_item_id?: number;
  }): Promise<unknown> {
    return this.request(
      'GET',
      'inventory_moves.json',
      params as Record<string, string | number | undefined>
    );
  }

  async createInventoryMove(params: {
    inventory_item_id: number;
    direction: string;
    quantity: number;
    price_per_unit?: number;
    moved_on?: string;
  }): Promise<unknown> {
    const { inventory_item_id, ...body } = params;
    return this.request(
      'POST',
      `inventory_items/${inventory_item_id}/inventory_moves.json`,
      undefined,
      body
    );
  }

  // ── Generators (Invoice Templates) ─────────────────────────────────

  async listGenerators(params: { page?: number; since?: string }): Promise<unknown> {
    return this.request(
      'GET',
      'generators.json',
      params as Record<string, string | number | undefined>
    );
  }

  async getGenerator(params: { id: number }): Promise<unknown> {
    return this.request('GET', `generators/${params.id}.json`);
  }

  async createGenerator(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', 'generators.json', undefined, data);
  }

  // ── Recurring Generators ───────────────────────────────────────────

  async listRecurringGenerators(params: { page?: number }): Promise<unknown> {
    return this.request(
      'GET',
      'recurring_generators.json',
      params as Record<string, string | number | undefined>
    );
  }

  async getRecurringGenerator(params: { id: number }): Promise<unknown> {
    return this.request('GET', `recurring_generators/${params.id}.json`);
  }

  // ── Events (Audit Log) ─────────────────────────────────────────────

  async listEvents(params: {
    page?: number;
    since?: string;
    subject_id?: number;
  }): Promise<unknown> {
    return this.request(
      'GET',
      'events.json',
      params as Record<string, string | number | undefined>
    );
  }

  // ── Todos ──────────────────────────────────────────────────────────

  async listTodos(params: { page?: number; since?: string }): Promise<unknown> {
    return this.request(
      'GET',
      'todos.json',
      params as Record<string, string | number | undefined>
    );
  }

  async toggleTodo(params: { id: number }): Promise<unknown> {
    return this.request('POST', `todos/${params.id}/toggle_completion.json`);
  }

  // ── Tags ─────────────────────────────────────────────────────────────

  async listTags(): Promise<unknown> {
    return this.request('GET', 'tags.json');
  }
}
