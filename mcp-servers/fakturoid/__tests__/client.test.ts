/**
 * Unit tests for FakturoidClient
 *
 * Tests mock global.fetch to verify HTTP requests are constructed correctly.
 * Every API call requires TWO fetches: token exchange + actual request.
 * After the first call the token is cached, so subsequent calls need only ONE fetch.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakturoidApiError, FakturoidClient } from '../src/client.js';

const mockFetch = vi.fn();

const BASE = 'https://app.fakturoid.cz/api/v3';
const SLUG = 'test-slug';
const CLIENT_ID = 'test-client-id';
const CLIENT_SECRET = 'test-client-secret';
const API_KEY = `${SLUG}:${CLIENT_ID}:${CLIENT_SECRET}`;

const expectedBasicAuth = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(data === undefined ? '' : JSON.stringify(data)),
  };
}

function tokenResponse() {
  return mockResponse({ access_token: 'test-token', expires_in: 7200 });
}

/** Mock a token exchange followed by an API response. */
function mockTokenAndResponse(data: unknown, status = 200) {
  mockFetch
    .mockResolvedValueOnce(tokenResponse())
    .mockResolvedValueOnce(mockResponse(data, status));
}

/** Mock only an API response (token already cached). */
function mockCachedResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce(mockResponse(data, status));
}

function url(path: string) {
  return `${BASE}/accounts/${SLUG}/${path}`;
}

describe('FakturoidClient', () => {
  let client: FakturoidClient;

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.useFakeTimers();
    client = new FakturoidClient(API_KEY);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // ── Constructor ──────────────────────────────────────────────────────

  describe('constructor', () => {
    it('rejects API key with fewer than 3 colon-separated parts', () => {
      expect(() => new FakturoidClient('only:two')).toThrow('Invalid API key format');
      expect(() => new FakturoidClient('nodelimiter')).toThrow('Invalid API key format');
    });

    it('rejects empty slug, clientId, or clientSecret', () => {
      expect(() => new FakturoidClient(':id:secret')).toThrow('required');
      expect(() => new FakturoidClient('slug::secret')).toThrow('required');
      expect(() => new FakturoidClient('slug:id:')).toThrow('required');
    });

    it('accepts valid slug:clientId:clientSecret', () => {
      const c = new FakturoidClient('my-slug:my-id:my-secret');
      expect(c).toBeInstanceOf(FakturoidClient);
    });

    it('handles clientSecret containing colons', () => {
      const c = new FakturoidClient('slug:id:secret:with:colons');
      expect(c).toBeInstanceOf(FakturoidClient);
      // Verify the secret is reassembled correctly by making a call
      mockTokenAndResponse({ name: 'test' });
      c.getAccount();
      const tokenCall = mockFetch.mock.calls[0];
      const authHeader = tokenCall[1].headers.Authorization;
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
      expect(decoded).toBe('id:secret:with:colons');
    });
  });

  // ── OAuth Token Exchange ─────────────────────────────────────────────

  describe('OAuth token exchange', () => {
    it('calls correct token URL with correct method and headers', async () => {
      mockTokenAndResponse({ name: 'Test Account' });
      await client.getAccount();

      const [tokenUrl, tokenInit] = mockFetch.mock.calls[0];
      expect(tokenUrl).toBe(`${BASE}/oauth/token`);
      expect(tokenInit.method).toBe('POST');
      expect(tokenInit.headers.Authorization).toBe(expectedBasicAuth);
      expect(tokenInit.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(tokenInit.headers.Accept).toBe('application/json');
      expect(tokenInit.headers['User-Agent']).toBe('LocalMcpGateway (support@dxheroes.io)');
      expect(tokenInit.body).toBe('grant_type=client_credentials');
    });

    it('throws TOKEN_EXCHANGE_FAILED on non-OK token response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse('Unauthorized', 401));

      await expect(client.getAccount()).rejects.toThrow(FakturoidApiError);
      try {
        mockFetch.mockResolvedValueOnce(mockResponse('Unauthorized', 401));
        await client.getAccount();
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('TOKEN_EXCHANGE_FAILED');
      }
    });
  });

  // ── Token Caching ────────────────────────────────────────────────────

  describe('token caching', () => {
    it('reuses token for second call within expiry window', async () => {
      mockTokenAndResponse({ name: 'Account' });
      await client.getAccount();
      expect(mockFetch).toHaveBeenCalledTimes(2); // token + API

      mockCachedResponse([{ id: 1 }]);
      await client.listUsers();
      expect(mockFetch).toHaveBeenCalledTimes(3); // only 1 more fetch (API only)
    });

    it('fetches new token after expiry', async () => {
      mockTokenAndResponse({ name: 'Account' });
      await client.getAccount();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Advance past token expiry (7200s) minus the 60s buffer
      vi.advanceTimersByTime(7200 * 1000);

      mockTokenAndResponse([{ id: 1 }]);
      await client.listUsers();
      // 2 (first call) + 2 (new token + API) = 4
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  // ── API Request Headers ──────────────────────────────────────────────

  describe('API request headers', () => {
    it('includes Bearer token, Accept, and User-Agent', async () => {
      mockTokenAndResponse({ name: 'Account' });
      await client.getAccount();

      const [, apiInit] = mockFetch.mock.calls[1];
      expect(apiInit.headers.Authorization).toBe('Bearer test-token');
      expect(apiInit.headers.Accept).toBe('application/json');
      expect(apiInit.headers['User-Agent']).toBe('LocalMcpGateway (support@dxheroes.io)');
    });

    it('adds Content-Type for POST requests with body', async () => {
      mockTokenAndResponse({ id: 1 });
      await client.createInvoice({ subject_id: 5 });

      const [, apiInit] = mockFetch.mock.calls[1];
      expect(apiInit.headers['Content-Type']).toBe('application/json');
    });

    it('adds Content-Type for PATCH requests with body', async () => {
      mockTokenAndResponse({ id: 1 });
      await client.updateInvoice({ id: 1 }, { note: 'updated' });

      const [, apiInit] = mockFetch.mock.calls[1];
      expect(apiInit.headers['Content-Type']).toBe('application/json');
    });

    it('does NOT add Content-Type for GET requests', async () => {
      mockTokenAndResponse({ name: 'Account' });
      await client.getAccount();

      const [, apiInit] = mockFetch.mock.calls[1];
      expect(apiInit.headers['Content-Type']).toBeUndefined();
    });

    it('does NOT add Content-Type for DELETE requests', async () => {
      mockTokenAndResponse(undefined, 204);
      await client.deleteInvoice({ id: 1 });

      const [, apiInit] = mockFetch.mock.calls[1];
      expect(apiInit.headers['Content-Type']).toBeUndefined();
    });
  });

  // ── Account ──────────────────────────────────────────────────────────

  describe('getAccount', () => {
    it('GET accounts/{slug}/account.json', async () => {
      mockTokenAndResponse({ name: 'Test' });
      const result = await client.getAccount();
      expect(result).toEqual({ name: 'Test' });
      expect(mockFetch.mock.calls[1][0]).toBe(url('account.json'));
      expect(mockFetch.mock.calls[1][1].method).toBe('GET');
    });
  });

  describe('listUsers', () => {
    it('GET accounts/{slug}/users.json', async () => {
      mockTokenAndResponse([{ id: 1 }]);
      await client.listUsers();
      expect(mockFetch.mock.calls[1][0]).toBe(url('users.json'));
    });
  });

  describe('listBankAccounts', () => {
    it('GET accounts/{slug}/bank_accounts.json', async () => {
      mockTokenAndResponse([{ id: 1 }]);
      await client.listBankAccounts();
      expect(mockFetch.mock.calls[1][0]).toBe(url('bank_accounts.json'));
    });
  });

  // ── Invoices ─────────────────────────────────────────────────────────

  describe('listInvoices', () => {
    it('GET with query params', async () => {
      mockTokenAndResponse([]);
      await client.listInvoices({ page: 2, status: 'paid' });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('invoices.json'));
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('status=paid');
    });
  });

  describe('getInvoice', () => {
    it('GET accounts/{slug}/invoices/{id}.json', async () => {
      mockTokenAndResponse({ id: 123 });
      await client.getInvoice({ id: 123 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('invoices/123.json'));
    });
  });

  describe('createInvoice', () => {
    it('POST with body', async () => {
      const data = { subject_id: 5, lines: [] };
      mockTokenAndResponse({ id: 1 });
      await client.createInvoice(data);
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('invoices.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(data);
    });
  });

  describe('updateInvoice', () => {
    it('PATCH with body', async () => {
      mockTokenAndResponse({ id: 123 });
      await client.updateInvoice({ id: 123 }, { note: 'updated' });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('invoices/123.json'));
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body)).toEqual({ note: 'updated' });
    });
  });

  describe('invoiceAction', () => {
    it('POST fire.json with event query param', async () => {
      mockTokenAndResponse(undefined, 204);
      await client.invoiceAction({ id: 123, event: 'pay' });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toContain(url('invoices/123/fire.json'));
      expect(callUrl).toContain('event=pay');
      expect(init.method).toBe('POST');
    });
  });

  describe('searchInvoices', () => {
    it('GET search.json with query param', async () => {
      mockTokenAndResponse([]);
      await client.searchInvoices({ query: 'test' });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('invoices/search.json'));
      expect(callUrl).toContain('query=test');
    });
  });

  describe('deleteInvoice', () => {
    it('DELETE returns undefined', async () => {
      mockTokenAndResponse(undefined, 204);
      const result = await client.deleteInvoice({ id: 123 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('invoices/123.json'));
      expect(mockFetch.mock.calls[1][1].method).toBe('DELETE');
      expect(result).toBeUndefined();
    });
  });

  // ── Invoice Payments ─────────────────────────────────────────────────

  describe('createPayment', () => {
    it('POST with amount in body', async () => {
      mockTokenAndResponse({ id: 1 });
      await client.createPayment({ id: 123, amount: 1000 });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('invoices/123/payments.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ amount: 1000 });
    });
  });

  describe('deletePayment', () => {
    it('DELETE invoice payment', async () => {
      mockTokenAndResponse(undefined, 204);
      await client.deletePayment({ invoice_id: 123, payment_id: 456 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('invoices/123/payments/456.json'));
      expect(mockFetch.mock.calls[1][1].method).toBe('DELETE');
    });
  });

  // ── Invoice Messages ─────────────────────────────────────────────────

  describe('sendInvoiceMessage', () => {
    it('POST with email in body', async () => {
      mockTokenAndResponse({});
      await client.sendInvoiceMessage({ id: 123, email: 'test@test.com' });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('invoices/123/message.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ email: 'test@test.com' });
    });
  });

  // ── Subjects ─────────────────────────────────────────────────────────

  describe('listSubjects', () => {
    it('GET with page param', async () => {
      mockTokenAndResponse([]);
      await client.listSubjects({ page: 1 });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('subjects.json'));
      expect(callUrl).toContain('page=1');
    });
  });

  describe('getSubject', () => {
    it('GET subjects/{id}.json', async () => {
      mockTokenAndResponse({ id: 5 });
      await client.getSubject({ id: 5 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('subjects/5.json'));
    });
  });

  describe('createSubject', () => {
    it('POST with body', async () => {
      const data = { name: 'Acme Corp' };
      mockTokenAndResponse({ id: 5 });
      await client.createSubject(data);
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('subjects.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(data);
    });
  });

  describe('searchSubjects', () => {
    it('GET search.json with query', async () => {
      mockTokenAndResponse([]);
      await client.searchSubjects({ query: 'acme' });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('subjects/search.json'));
      expect(callUrl).toContain('query=acme');
    });
  });

  describe('updateSubject', () => {
    it('PATCH with body', async () => {
      mockTokenAndResponse({ id: 5 });
      await client.updateSubject({ id: 5 }, { name: 'Acme Inc' });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('subjects/5.json'));
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body)).toEqual({ name: 'Acme Inc' });
    });
  });

  describe('deleteSubject', () => {
    it('DELETE subjects/{id}.json', async () => {
      mockTokenAndResponse(undefined, 204);
      await client.deleteSubject({ id: 5 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('subjects/5.json'));
      expect(mockFetch.mock.calls[1][1].method).toBe('DELETE');
    });
  });

  // ── Expenses ─────────────────────────────────────────────────────────

  describe('listExpenses', () => {
    it('GET with status param', async () => {
      mockTokenAndResponse([]);
      await client.listExpenses({ status: 'open' });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('expenses.json'));
      expect(callUrl).toContain('status=open');
    });
  });

  describe('createExpense', () => {
    it('POST with body', async () => {
      const data = { subject_id: 5, total: 1000 };
      mockTokenAndResponse({ id: 10 });
      await client.createExpense(data);
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('expenses.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(data);
    });
  });

  describe('getExpense', () => {
    it('GET expenses/{id}.json', async () => {
      mockTokenAndResponse({ id: 10 });
      await client.getExpense({ id: 10 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('expenses/10.json'));
    });
  });

  describe('updateExpense', () => {
    it('PATCH with body', async () => {
      mockTokenAndResponse({ id: 10 });
      await client.updateExpense({ id: 10 }, { note: 'updated' });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('expenses/10.json'));
      expect(init.method).toBe('PATCH');
    });
  });

  describe('searchExpenses', () => {
    it('GET search.json with query', async () => {
      mockTokenAndResponse([]);
      await client.searchExpenses({ query: 'office' });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('expenses/search.json'));
      expect(callUrl).toContain('query=office');
    });
  });

  // ── Expense Payments ─────────────────────────────────────────────────

  describe('createExpensePayment', () => {
    it('POST with amount in body', async () => {
      mockTokenAndResponse({ id: 1 });
      await client.createExpensePayment({ id: 10, amount: 500 });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('expenses/10/payments.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ amount: 500 });
    });
  });

  describe('deleteExpensePayment', () => {
    it('DELETE expense payment', async () => {
      mockTokenAndResponse(undefined, 204);
      await client.deleteExpensePayment({ expense_id: 10, payment_id: 20 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('expenses/10/payments/20.json'));
      expect(mockFetch.mock.calls[1][1].method).toBe('DELETE');
    });
  });

  // ── Inventory Items ──────────────────────────────────────────────────

  describe('listInventoryItems', () => {
    it('GET with page param', async () => {
      mockTokenAndResponse([]);
      await client.listInventoryItems({ page: 1 });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('inventory_items.json'));
      expect(callUrl).toContain('page=1');
    });
  });

  describe('getInventoryItem', () => {
    it('GET inventory_items/{id}.json', async () => {
      mockTokenAndResponse({ id: 7 });
      await client.getInventoryItem({ id: 7 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('inventory_items/7.json'));
    });
  });

  describe('createInventoryItem', () => {
    it('POST with body', async () => {
      const data = { name: 'Widget', article_number: 'W-001' };
      mockTokenAndResponse({ id: 7 });
      await client.createInventoryItem(data);
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('inventory_items.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(data);
    });
  });

  describe('updateInventoryItem', () => {
    it('PATCH with body', async () => {
      mockTokenAndResponse({ id: 7 });
      await client.updateInventoryItem({ id: 7 }, { name: 'Updated Widget' });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('inventory_items/7.json'));
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body)).toEqual({ name: 'Updated Widget' });
    });
  });

  describe('searchInventoryItems', () => {
    it('GET search.json with query', async () => {
      mockTokenAndResponse([]);
      await client.searchInventoryItems({ query: 'widget' });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('inventory_items/search.json'));
      expect(callUrl).toContain('query=widget');
    });
  });

  // ── Inventory Moves ──────────────────────────────────────────────────

  describe('listInventoryMoves', () => {
    it('GET with inventory_item_id param', async () => {
      mockTokenAndResponse([]);
      await client.listInventoryMoves({ inventory_item_id: 7 });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('inventory_moves.json'));
      expect(callUrl).toContain('inventory_item_id=7');
    });
  });

  describe('createInventoryMove', () => {
    it('POST to inventory_items/{id}/inventory_moves.json', async () => {
      mockTokenAndResponse({ id: 1 });
      await client.createInventoryMove({
        inventory_item_id: 7,
        direction: 'in',
        quantity: 10,
      });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('inventory_items/7/inventory_moves.json'));
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ direction: 'in', quantity: 10 });
    });
  });

  // ── Generators ───────────────────────────────────────────────────────

  describe('listGenerators', () => {
    it('GET generators.json', async () => {
      mockTokenAndResponse([]);
      await client.listGenerators({});
      expect(mockFetch.mock.calls[1][0]).toBe(url('generators.json'));
    });
  });

  describe('getGenerator', () => {
    it('GET generators/{id}.json', async () => {
      mockTokenAndResponse({ id: 3 });
      await client.getGenerator({ id: 3 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('generators/3.json'));
    });
  });

  describe('createGenerator', () => {
    it('POST generators.json', async () => {
      const data = { name: 'Monthly Invoice' };
      mockTokenAndResponse({ id: 3 });
      await client.createGenerator(data);
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('generators.json'));
      expect(init.method).toBe('POST');
    });
  });

  // ── Recurring Generators ─────────────────────────────────────────────

  describe('listRecurringGenerators', () => {
    it('GET recurring_generators.json', async () => {
      mockTokenAndResponse([]);
      await client.listRecurringGenerators({});
      expect(mockFetch.mock.calls[1][0]).toBe(url('recurring_generators.json'));
    });
  });

  describe('getRecurringGenerator', () => {
    it('GET recurring_generators/{id}.json', async () => {
      mockTokenAndResponse({ id: 4 });
      await client.getRecurringGenerator({ id: 4 });
      expect(mockFetch.mock.calls[1][0]).toBe(url('recurring_generators/4.json'));
    });
  });

  // ── Events & Todos ───────────────────────────────────────────────────

  describe('listEvents', () => {
    it('GET events.json with subject_id param', async () => {
      mockTokenAndResponse([]);
      await client.listEvents({ subject_id: 5 });
      const callUrl = mockFetch.mock.calls[1][0];
      expect(callUrl).toContain(url('events.json'));
      expect(callUrl).toContain('subject_id=5');
    });
  });

  describe('listTodos', () => {
    it('GET todos.json', async () => {
      mockTokenAndResponse([]);
      await client.listTodos({});
      expect(mockFetch.mock.calls[1][0]).toBe(url('todos.json'));
    });
  });

  describe('toggleTodo', () => {
    it('POST todos/{id}/toggle_completion.json', async () => {
      mockTokenAndResponse({});
      await client.toggleTodo({ id: 1 });
      const [callUrl, init] = mockFetch.mock.calls[1];
      expect(callUrl).toBe(url('todos/1/toggle_completion.json'));
      expect(init.method).toBe('POST');
    });
  });

  describe('listTags', () => {
    it('GET tags.json', async () => {
      mockTokenAndResponse([]);
      await client.listTags();
      expect(mockFetch.mock.calls[1][0]).toBe(url('tags.json'));
    });
  });

  // ── Error Handling ───────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws INVALID_API_KEY on 401', async () => {
      mockTokenAndResponse('Unauthorized', 401);
      try {
        await client.getAccount();
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('INVALID_API_KEY');
        expect((e as FakturoidApiError).status).toBe(401);
      }
    });

    it('throws INVALID_API_KEY on 403', async () => {
      mockTokenAndResponse('Forbidden', 403);
      try {
        await client.getAccount();
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('INVALID_API_KEY');
      }
    });

    it('throws NOT_FOUND on 404', async () => {
      mockTokenAndResponse('Not Found', 404);
      try {
        await client.getInvoice({ id: 999 });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('NOT_FOUND');
      }
    });

    it('throws RATE_LIMITED on 429', async () => {
      mockTokenAndResponse('Too Many Requests', 429);
      try {
        await client.getAccount();
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('RATE_LIMITED');
      }
    });

    it('throws BAD_REQUEST on 400', async () => {
      mockTokenAndResponse('Bad Request', 400);
      try {
        await client.createInvoice({});
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('BAD_REQUEST');
      }
    });

    it('throws UNPROCESSABLE on 422', async () => {
      mockTokenAndResponse('Unprocessable Entity', 422);
      try {
        await client.createInvoice({});
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('UNPROCESSABLE');
      }
    });

    it('throws API_ERROR on 500', async () => {
      mockTokenAndResponse('Server Error', 500);
      try {
        await client.getAccount();
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FakturoidApiError);
        expect((e as FakturoidApiError).code).toBe('API_ERROR');
      }
    });

    it('DELETE 204 returns undefined', async () => {
      mockTokenAndResponse(undefined, 204);
      const result = await client.deleteInvoice({ id: 1 });
      expect(result).toBeUndefined();
    });

    it('POST 204 (fire.json) returns undefined', async () => {
      mockTokenAndResponse(undefined, 204);
      const result = await client.invoiceAction({ id: 1, event: 'pay' });
      expect(result).toBeUndefined();
    });
  });

  // ── validateApiKey ───────────────────────────────────────────────────

  describe('validateApiKey', () => {
    it('returns valid: true on success', async () => {
      mockTokenAndResponse({ name: 'Test Account' });
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: true });
    });

    it('returns valid: false on INVALID_API_KEY', async () => {
      mockTokenAndResponse('Forbidden', 403);
      const result = await client.validateApiKey();
      expect(result).toEqual({
        valid: false,
        error: 'Invalid OAuth credentials or account slug',
      });
    });

    it('returns valid: false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await client.validateApiKey();
      expect(result).toEqual({
        valid: false,
        error: expect.stringContaining('ECONNREFUSED'),
      });
    });
  });
});
