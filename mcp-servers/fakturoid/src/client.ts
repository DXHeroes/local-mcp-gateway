/**
 * Fakturoid API v3 client — thin HTTP wrapper around fetch
 *
 * Auth: Bearer token (Personal Access Token)
 * API: https://app.fakturoid.cz/api/v3/accounts/{slug}/
 * Docs: https://www.fakturoid.cz/api/v3
 * Rate limit: tracked via X-RateLimit-* headers
 */

export type FakturoidErrorCode =
  | 'INVALID_API_KEY'
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
  private readonly token: string;
  private readonly slug: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;

  constructor(
    apiKey: string,
    baseUrl = 'https://app.fakturoid.cz/api/v3',
    userAgent = 'LocalMcpGateway (support@dxheroes.io)'
  ) {
    const separatorIndex = apiKey.indexOf(':');
    if (separatorIndex === -1) {
      throw new Error(
        'Invalid API key format. Expected "slug:personal_access_token". ' +
          'Get your token at Settings > API in your Fakturoid account.'
      );
    }
    this.slug = apiKey.substring(0, separatorIndex);
    this.token = apiKey.substring(separatorIndex + 1);

    if (!this.slug || !this.token) {
      throw new Error(
        'Invalid API key format. Both slug and token are required. ' +
          'Format: "your-account-slug:your-personal-access-token"'
      );
    }

    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
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
      Authorization: `Bearer ${this.token}`,
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
        return { valid: false, error: 'Invalid API key or account slug' };
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
