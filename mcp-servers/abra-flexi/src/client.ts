/**
 * Abra Flexi REST API client — thin HTTP wrapper around fetch
 *
 * Auth: Basic auth (username:password)
 * API: https://{server}/c/{company}/{evidence}.json
 * Docs: https://podpora.flexibee.eu/en/collections/2592813-dokumentacia-rest-api
 *
 * Response format: { "winstrom": { "@version": "...", "evidence-name": [...] } }
 */

export type FlexiErrorCode =
  | 'INVALID_API_KEY'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'UNPROCESSABLE'
  | 'API_ERROR';

export class FlexiApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: FlexiErrorCode
  ) {
    super(`${code}: ${message}`);
    this.name = 'FlexiApiError';
  }
}

export class FlexiClient {
  private readonly authHeader: string;
  private readonly baseUrl: string;

  constructor(apiKey: string) {
    const separatorIndex = apiKey.indexOf('|');
    if (separatorIndex === -1) {
      throw new Error(
        'Invalid API key format. Expected "https://server/c/company|username:password". ' +
          'Example: "https://demo.flexibee.eu/c/demo|admin:admin"'
      );
    }

    this.baseUrl = apiKey.substring(0, separatorIndex).replace(/\/$/, '');
    const credentials = apiKey.substring(separatorIndex + 1);

    if (!this.baseUrl || !credentials || !credentials.includes(':')) {
      throw new Error(
        'Invalid API key format. Both server URL and credentials (user:pass) are required. ' +
          'Format: "https://server/c/company|username:password"'
      );
    }

    const encoded = Buffer.from(credentials).toString('base64');
    this.authHeader = `Basic ${encoded}`;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private buildUrl(
    evidence: string,
    id?: string | number,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    let url = `${this.baseUrl}/${evidence}`;
    if (id !== undefined) {
      url += `/${id}`;
    }
    url += '.json';

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
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    evidence: string,
    id?: string | number,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    const url = this.buildUrl(evidence, id, params);
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: 'application/json',
    };
    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      // Flexi expects data wrapped in { "winstrom": { "evidence-name": { ... } } }
      init.body = JSON.stringify({ winstrom: { [evidence]: body } });
    }

    const response = await fetch(url, init);

    if (method === 'DELETE' && response.ok) {
      return undefined as T;
    }

    if (!response.ok) {
      const code = this.mapStatusToCode(response.status);
      let message: string;
      try {
        const errorBody = await response.text();
        // Try to parse Flexi error format
        try {
          const parsed = JSON.parse(errorBody);
          if (parsed?.winstrom?.message) {
            message = parsed.winstrom.message;
          } else {
            message = errorBody;
          }
        } catch {
          message = errorBody || response.statusText;
        }
      } catch {
        message = response.statusText;
      }
      throw new FlexiApiError(message, response.status, code);
    }

    const text = await response.text();
    if (!text) return undefined as T;

    const parsed = JSON.parse(text);
    // Unwrap Flexi response wrapper
    if (parsed?.winstrom) {
      return parsed.winstrom as T;
    }
    return parsed as T;
  }

  private mapStatusToCode(status: number): FlexiErrorCode {
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
      // Fetch company info to validate credentials
      const url = `${this.baseUrl}.json`;
      const response = await fetch(url, {
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { valid: false, error: 'Invalid credentials' };
        }
        return { valid: false, error: `Server returned ${response.status}` };
      }
      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Validation failed: ${message}` };
    }
  }

  // ── Account ──────────────────────────────────────────────────────────

  async getAccountInfo(): Promise<unknown> {
    const url = `${this.baseUrl}.json`;
    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new FlexiApiError(
        response.statusText,
        response.status,
        this.mapStatusToCode(response.status)
      );
    }
    const parsed = JSON.parse(await response.text());
    return parsed?.winstrom ?? parsed;
  }

  // ── Generic list/get/create ──────────────────────────────────────────

  async listRecords(
    evidence: string,
    params?: {
      limit?: number;
      start?: number;
      order?: string;
      filter?: string;
      detail?: string;
    }
  ): Promise<unknown> {
    return this.request(
      'GET',
      evidence,
      undefined,
      params as Record<string, string | number | undefined>
    );
  }

  async getRecord(evidence: string, id: string | number): Promise<unknown> {
    return this.request('GET', evidence, id);
  }

  async createRecord(evidence: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', evidence, undefined, undefined, data);
  }

  async updateRecord(
    evidence: string,
    id: string | number,
    data: Record<string, unknown>
  ): Promise<unknown> {
    return this.request('PUT', evidence, id, undefined, data);
  }

  async deleteRecord(evidence: string, id: string | number): Promise<unknown> {
    return this.request('DELETE', evidence, id);
  }

  // ── Issued Invoices (faktura-vydana) ─────────────────────────────────

  async listIssuedInvoices(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('faktura-vydana', params);
  }

  async getIssuedInvoice(id: string | number): Promise<unknown> {
    return this.getRecord('faktura-vydana', id);
  }

  async createIssuedInvoice(data: Record<string, unknown>): Promise<unknown> {
    return this.createRecord('faktura-vydana', data);
  }

  async updateIssuedInvoice(
    id: string | number,
    data: Record<string, unknown>
  ): Promise<unknown> {
    return this.updateRecord('faktura-vydana', id, data);
  }

  // ── Received Invoices (faktura-prijata) ──────────────────────────────

  async listReceivedInvoices(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('faktura-prijata', params);
  }

  async createReceivedInvoice(data: Record<string, unknown>): Promise<unknown> {
    return this.createRecord('faktura-prijata', data);
  }

  async getReceivedInvoice(id: string | number): Promise<unknown> {
    return this.getRecord('faktura-prijata', id);
  }

  async updateReceivedInvoice(
    id: string | number,
    data: Record<string, unknown>
  ): Promise<unknown> {
    return this.updateRecord('faktura-prijata', id, data);
  }

  // ── Contacts (adresar) ──────────────────────────────────────────────

  async listContacts(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('adresar', params);
  }

  async getContact(id: string | number): Promise<unknown> {
    return this.getRecord('adresar', id);
  }

  async createContact(data: Record<string, unknown>): Promise<unknown> {
    return this.createRecord('adresar', data);
  }

  async updateContact(id: string | number, data: Record<string, unknown>): Promise<unknown> {
    return this.updateRecord('adresar', id, data);
  }

  // ── Bank Statements (banka) ─────────────────────────────────────────

  async listBankStatements(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('banka', params);
  }

  // ── Products (cenik) ────────────────────────────────────────────────

  async listProducts(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('cenik', params);
  }

  async createProduct(data: Record<string, unknown>): Promise<unknown> {
    return this.createRecord('cenik', data);
  }

  async updateProduct(id: string | number, data: Record<string, unknown>): Promise<unknown> {
    return this.updateRecord('cenik', id, data);
  }

  // ── Orders Received (objednavka-prijata) ──────────────────────────────

  async listOrdersReceived(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('objednavka-prijata', params);
  }

  async createOrderReceived(data: Record<string, unknown>): Promise<unknown> {
    return this.createRecord('objednavka-prijata', data);
  }

  // ── Orders Issued (objednavka-vydana) ─────────────────────────────────

  async listOrdersIssued(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('objednavka-vydana', params);
  }

  async createOrderIssued(data: Record<string, unknown>): Promise<unknown> {
    return this.createRecord('objednavka-vydana', data);
  }

  // ── Cash Movements (pokladni-pohyb) ───────────────────────────────────

  async listCashMovements(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('pokladni-pohyb', params);
  }

  // ── Internal Documents (interni-doklad) ───────────────────────────────

  async listInternalDocuments(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('interni-doklad', params);
  }

  async createInternalDocument(data: Record<string, unknown>): Promise<unknown> {
    return this.createRecord('interni-doklad', data);
  }

  // ── Stock Movements (skladovy-pohyb) ──────────────────────────────────

  async listStockMovements(params?: {
    limit?: number;
    start?: number;
    order?: string;
    filter?: string;
  }): Promise<unknown> {
    return this.listRecords('skladovy-pohyb', params);
  }
}
