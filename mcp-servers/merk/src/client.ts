/**
 * Merk API client — thin HTTP wrapper around fetch
 *
 * One method per API endpoint. Auth: Token {api_key}
 * Base URL: https://api.merk.cz
 * Docs: https://api.merk.cz/docs/
 */

export type MerkErrorCode =
  | 'INVALID_API_KEY'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'API_ERROR';

export class MerkApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: MerkErrorCode
  ) {
    super(`${code}: ${message}`);
    this.name = 'MerkApiError';
  }
}

export class MerkClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.merk.cz') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = `${this.baseUrl}${path}`;
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
    method: 'GET' | 'POST',
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const headers: Record<string, string> = {
      Authorization: `Token ${this.apiKey}`,
    };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const code = this.mapStatusToCode(response.status);
      let message: string;
      try {
        const errorBody = await response.json();
        message = (errorBody as { detail?: string }).detail || response.statusText;
      } catch {
        message = response.statusText;
      }
      throw new MerkApiError(message, response.status, code);
    }

    return response.json() as Promise<T>;
  }

  private mapStatusToCode(status: number): MerkErrorCode {
    if (status === 401 || status === 403) return 'INVALID_API_KEY';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 400) return 'BAD_REQUEST';
    return 'API_ERROR';
  }

  // ── Validation ───────────────────────────────────────────────────────

  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.request('GET', '/subscriptions/');
      return { valid: true };
    } catch (error) {
      if (error instanceof MerkApiError && error.code === 'INVALID_API_KEY') {
        return { valid: false, error: 'Invalid API key' };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Validation failed: ${message}` };
    }
  }

  // ── Company endpoints ────────────────────────────────────────────────

  async companyLookup(params: {
    regno?: string;
    vatno?: string;
    country_code?: string;
  }): Promise<unknown> {
    return this.request('GET', '/company/', params);
  }

  async companyBatch(params: { regnos: string[] }): Promise<unknown> {
    if (params.regnos.length > 500) {
      throw new MerkApiError('Maximum 500 regnos per batch request', 400, 'BAD_REQUEST');
    }
    return this.request('POST', '/company/mget/', undefined, { regnos: params.regnos });
  }

  async suggest(params: {
    name?: string;
    email?: string;
    bank_account?: string;
    only_active?: boolean;
  }): Promise<unknown> {
    return this.request('GET', '/suggest/', params as Record<string, string | boolean | undefined>);
  }

  async searchCompanies(params: {
    country: 'cz' | 'sk';
    filters: Record<string, unknown>;
    page?: number;
    page_size?: number;
  }): Promise<unknown> {
    const queryParams: Record<string, number | undefined> = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.page_size !== undefined) queryParams.page_size = params.page_size;
    return this.request(
      'POST',
      `/search/${params.country}/`,
      queryParams as Record<string, string | number | undefined>,
      params.filters
    );
  }

  async financialStatements(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/financial-statements/', params);
  }

  async financialIndicators(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/financial-indicators/', params);
  }

  async companyEmployees(params: {
    regno: string;
    page?: number;
    page_size?: number;
  }): Promise<unknown> {
    return this.request(
      'GET',
      '/company/employees/',
      params as Record<string, string | number | undefined>
    );
  }

  async companyFleet(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/fleet/', params);
  }

  async companyFleetStats(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/fleet-stats/', params);
  }

  async companyBusinessPremises(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/business-premises/', params);
  }

  async companyLicenses(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/licenses/', params);
  }

  async companyEvents(params: {
    regno: string;
    from_date?: string;
    to_date?: string;
  }): Promise<unknown> {
    return this.request('GET', '/company/events/', params as Record<string, string | undefined>);
  }

  async newCompanies(params: {
    from_date: string;
    to_date: string;
    country_code?: string;
    page?: number;
    page_size?: number;
  }): Promise<unknown> {
    return this.request(
      'GET',
      '/company/new2/',
      params as Record<string, string | number | undefined>
    );
  }

  async updatedCompanies(params: {
    from_date: string;
    to_date: string;
    country_code?: string;
    page?: number;
    page_size?: number;
  }): Promise<unknown> {
    return this.request(
      'GET',
      '/company/updates2/',
      params as Record<string, string | number | undefined>
    );
  }

  async companyJobAds(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/job-ads/', params);
  }

  async companyGovContracts(params: { regno: string }): Promise<unknown> {
    return this.request('GET', '/company/gov-contracts/', params);
  }

  // ── Relations endpoints ──────────────────────────────────────────────

  async relationsCompany(params: { company_id: string; relation_type?: string }): Promise<unknown> {
    return this.request('GET', '/relations/company/', params as Record<string, string | undefined>);
  }

  async relationsPerson(params: { person_id: string; relation_type?: string }): Promise<unknown> {
    return this.request('GET', '/relations/person/', params as Record<string, string | undefined>);
  }

  async relationsSearchPerson(params: { name: string; birth_date?: string }): Promise<unknown> {
    return this.request(
      'GET',
      '/relations/search/person/',
      params as Record<string, string | undefined>
    );
  }

  async relationsShortestPath(params: {
    node1_id: string;
    node1_label: string;
    node2_id: string;
    node2_label: string;
    relation_type?: string;
  }): Promise<unknown> {
    return this.request(
      'GET',
      '/relations/shortest-path/',
      params as Record<string, string | undefined>
    );
  }

  // ── Utility endpoints ────────────────────────────────────────────────

  async enums(params: { enum_id?: string }): Promise<unknown> {
    const path = params.enum_id ? `/enums/${params.enum_id}/` : '/enums/';
    return this.request('GET', path);
  }

  async subscriptionInfo(): Promise<unknown> {
    return this.request('GET', '/subscriptions/');
  }

  async vokativ(params: { first_name: string; last_name: string }): Promise<unknown> {
    return this.request('GET', '/vokativ/', params);
  }
}
