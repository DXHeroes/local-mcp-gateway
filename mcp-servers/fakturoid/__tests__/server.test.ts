/**
 * Unit tests for FakturoidMcpServer
 */

import type { ApiKeyConfig } from '@dxheroes/local-mcp-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakturoidMcpServer } from '../src/server.js';

// Mock all client methods
const mockValidateApiKey = vi.fn();
const mockGetAccount = vi.fn();
const mockListUsers = vi.fn();
const mockListBankAccounts = vi.fn();
const mockListInvoices = vi.fn();
const mockGetInvoice = vi.fn();
const mockCreateInvoice = vi.fn();
const mockUpdateInvoice = vi.fn();
const mockInvoiceAction = vi.fn();
const mockSearchInvoices = vi.fn();
const mockDeleteInvoice = vi.fn();
const mockCreatePayment = vi.fn();
const mockDeletePayment = vi.fn();
const mockSendInvoiceMessage = vi.fn();
const mockListSubjects = vi.fn();
const mockGetSubject = vi.fn();
const mockCreateSubject = vi.fn();
const mockSearchSubjects = vi.fn();
const mockUpdateSubject = vi.fn();
const mockDeleteSubject = vi.fn();
const mockListExpenses = vi.fn();
const mockCreateExpense = vi.fn();
const mockGetExpense = vi.fn();
const mockUpdateExpense = vi.fn();
const mockSearchExpenses = vi.fn();
const mockDeleteExpense = vi.fn();
const mockExpenseAction = vi.fn();
const mockCreateExpensePayment = vi.fn();
const mockDeleteExpensePayment = vi.fn();
const mockListInventoryItems = vi.fn();
const mockGetInventoryItem = vi.fn();
const mockCreateInventoryItem = vi.fn();
const mockUpdateInventoryItem = vi.fn();
const mockSearchInventoryItems = vi.fn();
const mockListInventoryMoves = vi.fn();
const mockCreateInventoryMove = vi.fn();
const mockListGenerators = vi.fn();
const mockGetGenerator = vi.fn();
const mockCreateGenerator = vi.fn();
const mockListRecurringGenerators = vi.fn();
const mockGetRecurringGenerator = vi.fn();
const mockListEvents = vi.fn();
const mockListTodos = vi.fn();
const mockToggleTodo = vi.fn();
const mockListTags = vi.fn();
const mockListNumberFormats = vi.fn();

vi.mock('../src/client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/client.js')>();
  return {
    ...original,
    FakturoidClient: class MockFakturoidClient {
      validateApiKey = mockValidateApiKey;
      getAccount = mockGetAccount;
      listUsers = mockListUsers;
      listBankAccounts = mockListBankAccounts;
      listInvoices = mockListInvoices;
      getInvoice = mockGetInvoice;
      createInvoice = mockCreateInvoice;
      updateInvoice = mockUpdateInvoice;
      invoiceAction = mockInvoiceAction;
      searchInvoices = mockSearchInvoices;
      deleteInvoice = mockDeleteInvoice;
      createPayment = mockCreatePayment;
      deletePayment = mockDeletePayment;
      sendInvoiceMessage = mockSendInvoiceMessage;
      listSubjects = mockListSubjects;
      getSubject = mockGetSubject;
      createSubject = mockCreateSubject;
      searchSubjects = mockSearchSubjects;
      updateSubject = mockUpdateSubject;
      deleteSubject = mockDeleteSubject;
      listExpenses = mockListExpenses;
      createExpense = mockCreateExpense;
      getExpense = mockGetExpense;
      updateExpense = mockUpdateExpense;
      searchExpenses = mockSearchExpenses;
      deleteExpense = mockDeleteExpense;
      expenseAction = mockExpenseAction;
      createExpensePayment = mockCreateExpensePayment;
      deleteExpensePayment = mockDeleteExpensePayment;
      listInventoryItems = mockListInventoryItems;
      getInventoryItem = mockGetInventoryItem;
      createInventoryItem = mockCreateInventoryItem;
      updateInventoryItem = mockUpdateInventoryItem;
      searchInventoryItems = mockSearchInventoryItems;
      listInventoryMoves = mockListInventoryMoves;
      createInventoryMove = mockCreateInventoryMove;
      listGenerators = mockListGenerators;
      getGenerator = mockGetGenerator;
      createGenerator = mockCreateGenerator;
      listRecurringGenerators = mockListRecurringGenerators;
      getRecurringGenerator = mockGetRecurringGenerator;
      listEvents = mockListEvents;
      listTodos = mockListTodos;
      toggleTodo = mockToggleTodo;
      listTags = mockListTags;
      listNumberFormats = mockListNumberFormats;
    },
  };
});

describe('FakturoidMcpServer', () => {
  const apiKeyConfig: ApiKeyConfig = {
    apiKey: 'test-slug:test-client-id:test-client-secret',
    headerName: 'Authorization',
    headerValue: 'Bearer test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── initialize ──────────────────────────────────────────────────────

  describe('initialize', () => {
    it('should initialize successfully with valid API key config', async () => {
      const server = new FakturoidMcpServer(apiKeyConfig);
      await server.initialize();

      mockGetAccount.mockResolvedValue({ name: 'Test Account' });
      const result = (await server.callTool('fakturoid_get_account', {})) as {
        isError?: boolean;
      };
      expect(result.isError).toBeUndefined();
    });

    it('should return API_KEY_REQUIRED error when apiKeyConfig is null', async () => {
      const server = new FakturoidMcpServer(null);
      await server.initialize();

      const result = (await server.callTool('fakturoid_get_account', {})) as {
        isError: boolean;
        content: Array<{ text: string }>;
      };
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_KEY_REQUIRED');
    });

    it('should return API_KEY_REQUIRED error when apiKey is empty string', async () => {
      const server = new FakturoidMcpServer({ ...apiKeyConfig, apiKey: '' });
      await server.initialize();

      const result = (await server.callTool('fakturoid_get_account', {})) as {
        isError: boolean;
        content: Array<{ text: string }>;
      };
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_KEY_REQUIRED');
    });
  });

  // ── validate ────────────────────────────────────────────────────────

  describe('validate', () => {
    it('should delegate to client.validateApiKey()', async () => {
      const server = new FakturoidMcpServer(apiKeyConfig);
      await server.initialize();

      mockValidateApiKey.mockResolvedValue({ valid: true });
      const result = await server.validate();
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid when no API key is configured', async () => {
      const server = new FakturoidMcpServer(null);
      await server.initialize();

      const result = await server.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ── listTools ───────────────────────────────────────────────────────

  describe('listTools', () => {
    it('should return 43 tools', async () => {
      const server = new FakturoidMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      expect(tools).toHaveLength(45);
    });

    it('should have all tool names starting with fakturoid_', async () => {
      const server = new FakturoidMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      for (const tool of tools) {
        expect(tool.name).toMatch(/^fakturoid_/);
      }
    });

    it('should have name, description, and inputSchema on each tool', async () => {
      const server = new FakturoidMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      for (const tool of tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
      }
    });
  });

  // ── callTool - dispatching ──────────────────────────────────────────

  describe('callTool - dispatching', () => {
    let server: FakturoidMcpServer;

    beforeEach(async () => {
      server = new FakturoidMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('fakturoid_get_account calls getAccount()', async () => {
      mockGetAccount.mockResolvedValue({ name: 'Acme' });

      const result = (await server.callTool('fakturoid_get_account', {})) as {
        content: Array<{ text: string }>;
      };

      expect(mockGetAccount).toHaveBeenCalledOnce();
      const data = JSON.parse(result.content[0].text);
      expect(data.name).toBe('Acme');
    });

    it('fakturoid_list_invoices calls listInvoices() with filters', async () => {
      mockListInvoices.mockResolvedValue([{ id: 1 }]);

      await server.callTool('fakturoid_list_invoices', { page: 1, status: 'paid' });

      expect(mockListInvoices).toHaveBeenCalledWith({ page: 1, status: 'paid' });
    });

    it('fakturoid_create_invoice calls createInvoice(data)', async () => {
      mockCreateInvoice.mockResolvedValue({ id: 10 });
      const invoiceData = {
        subject_id: 1,
        lines: [{ name: 'Service', unit_price: 100 }],
      };

      await server.callTool('fakturoid_create_invoice', invoiceData);

      expect(mockCreateInvoice).toHaveBeenCalledWith(invoiceData);
    });

    it('fakturoid_update_invoice splits id from data', async () => {
      mockUpdateInvoice.mockResolvedValue({ id: 5 });

      await server.callTool('fakturoid_update_invoice', { id: 5, note: 'test' });

      expect(mockUpdateInvoice).toHaveBeenCalledWith({ id: 5 }, { note: 'test' });
    });

    it('fakturoid_invoice_action calls invoiceAction()', async () => {
      mockInvoiceAction.mockResolvedValue({});

      await server.callTool('fakturoid_invoice_action', { id: 5, event: 'pay' });

      expect(mockInvoiceAction).toHaveBeenCalledWith({ id: 5, event: 'pay' });
    });

    it('fakturoid_search_subjects calls searchSubjects()', async () => {
      mockSearchSubjects.mockResolvedValue([]);

      await server.callTool('fakturoid_search_subjects', { query: 'acme' });

      expect(mockSearchSubjects).toHaveBeenCalledWith({ query: 'acme' });
    });

    it('fakturoid_update_subject splits id from data', async () => {
      mockUpdateSubject.mockResolvedValue({ id: 3 });

      await server.callTool('fakturoid_update_subject', { id: 3, name: 'New' });

      expect(mockUpdateSubject).toHaveBeenCalledWith({ id: 3 }, { name: 'New' });
    });

    it('fakturoid_update_expense splits id from data', async () => {
      mockUpdateExpense.mockResolvedValue({ id: 7 });

      await server.callTool('fakturoid_update_expense', { id: 7, note: 'x' });

      expect(mockUpdateExpense).toHaveBeenCalledWith({ id: 7 }, { note: 'x' });
    });

    it('fakturoid_update_inventory_item splits id from data', async () => {
      mockUpdateInventoryItem.mockResolvedValue({ id: 2 });

      await server.callTool('fakturoid_update_inventory_item', { id: 2, name: 'y' });

      expect(mockUpdateInventoryItem).toHaveBeenCalledWith({ id: 2 }, { name: 'y' });
    });

    it('fakturoid_create_inventory_move calls createInventoryMove(args)', async () => {
      mockCreateInventoryMove.mockResolvedValue({ id: 99 });
      const moveArgs = {
        inventory_item_id: 10,
        direction: 'in' as const,
        quantity: 5,
      };

      await server.callTool('fakturoid_create_inventory_move', moveArgs);

      expect(mockCreateInventoryMove).toHaveBeenCalledWith(moveArgs);
    });

    it('fakturoid_delete_expense calls deleteExpense(args)', async () => {
      mockDeleteExpense.mockResolvedValue(undefined);

      await server.callTool('fakturoid_delete_expense', { id: 42 });

      expect(mockDeleteExpense).toHaveBeenCalledWith({ id: 42 });
    });

    it('fakturoid_expense_action calls expenseAction(args)', async () => {
      mockExpenseAction.mockResolvedValue({});

      await server.callTool('fakturoid_expense_action', { id: 5, event: 'lock' });

      expect(mockExpenseAction).toHaveBeenCalledWith({ id: 5, event: 'lock' });
    });

    it('fakturoid_list_number_formats calls listNumberFormats()', async () => {
      mockListNumberFormats.mockResolvedValue([{ id: 1, format: 'INV-{n}' }]);

      const result = (await server.callTool('fakturoid_list_number_formats', {})) as {
        content: Array<{ text: string }>;
      };

      expect(mockListNumberFormats).toHaveBeenCalledOnce();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveLength(1);
    });
  });

  // ── callTool - error handling ───────────────────────────────────────

  describe('callTool - error handling', () => {
    let server: FakturoidMcpServer;

    beforeEach(async () => {
      server = new FakturoidMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return UNKNOWN_TOOL error for unknown tool name', async () => {
      const result = (await server.callTool('fakturoid_nonexistent', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('UNKNOWN_TOOL');
    });

    it('should return INVALID_INPUT error with Zod issue details', async () => {
      const result = (await server.callTool('fakturoid_get_invoice', {
        id: 'not-a-number',
      })) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('INVALID_INPUT');
      expect(errorData.details).toBeDefined();
      expect(errorData.details.length).toBeGreaterThan(0);
      expect(errorData.details[0].path).toBe('id');
    });

    it('should return structured error when client throws FakturoidApiError', async () => {
      const { FakturoidApiError } = await import('../src/client.js');
      mockGetAccount.mockRejectedValue(
        new FakturoidApiError('Not found', 404, 'NOT_FOUND')
      );

      const result = (await server.callTool('fakturoid_get_account', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('NOT_FOUND');
      expect(errorData.message).toContain('Not found');
    });

    it('should return API_ERROR when client throws generic Error', async () => {
      mockGetAccount.mockRejectedValue(new Error('Network failure'));

      const result = (await server.callTool('fakturoid_get_account', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_ERROR');
      expect(errorData.message).toBe('Network failure');
    });
  });

  // ── listResources ───────────────────────────────────────────────────

  describe('listResources', () => {
    it('should return empty array', async () => {
      const server = new FakturoidMcpServer(apiKeyConfig);
      const resources = await server.listResources();
      expect(resources).toEqual([]);
    });
  });
});
