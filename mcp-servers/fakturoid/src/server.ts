/**
 * Fakturoid MCP Server
 *
 * Wraps the Fakturoid API v3.
 * Provides 14 tools covering invoices, subjects, expenses, and account info.
 */

import type { ApiKeyConfig, McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { McpServer } from '@dxheroes/local-mcp-core';
import { z } from 'zod';
import { FakturoidApiError, FakturoidClient } from './client.js';
import {
  CreateExpenseSchema,
  CreateExpensePaymentSchema,
  CreateGeneratorSchema,
  CreateInventoryItemSchema,
  CreateInventoryMoveSchema,
  CreateInvoiceSchema,
  CreatePaymentSchema,
  CreateSubjectSchema,
  DeleteExpensePaymentSchema,
  DeleteInvoiceSchema,
  DeletePaymentSchema,
  DeleteSubjectSchema,
  EmptySchema,
  GetExpenseSchema,
  GetGeneratorSchema,
  GetInventoryItemSchema,
  GetInvoiceSchema,
  GetRecurringGeneratorSchema,
  GetSubjectSchema,
  InvoiceActionSchema,
  ListEventsSchema,
  ListExpensesSchema,
  ListGeneratorsSchema,
  ListInventoryItemsSchema,
  ListInventoryMovesSchema,
  ListInvoicesSchema,
  ListRecurringGeneratorsSchema,
  ListSubjectsSchema,
  ListTodosSchema,
  SearchExpensesSchema,
  SearchInventoryItemsSchema,
  SearchInvoicesSchema,
  SearchSubjectsSchema,
  SendInvoiceMessageSchema,
  ToggleTodoSchema,
  UpdateExpenseSchema,
  UpdateInventoryItemSchema,
  UpdateInvoiceSchema,
  UpdateSubjectSchema,
} from './schemas.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (args: unknown) => Promise<unknown>;
}

export class FakturoidMcpServer extends McpServer {
  private client: FakturoidClient | null = null;
  private initError: string | null = null;
  private toolDefs: ToolDef[] = [];

  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> {
    if (!this.apiKeyConfig?.apiKey) {
      this.initError =
        'Fakturoid API key is not configured. Please configure the API key in the MCP server settings. Format: slug:personal_access_token';
      console.warn('[Fakturoid] No API key configured');
      return;
    }

    try {
      this.client = new FakturoidClient(this.apiKeyConfig.apiKey);
      this.initError = null;
      this.toolDefs = this.buildToolDefs();
    } catch (error) {
      this.initError = `Failed to initialize Fakturoid client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Fakturoid] Initialization error:', error);
    }
  }

  override async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKeyConfig?.apiKey) {
      return { valid: false, error: 'API key not configured' };
    }

    try {
      const client = new FakturoidClient(this.apiKeyConfig.apiKey);
      return await client.validateApiKey();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: `Validation failed: ${msg}` };
    }
  }

  async listTools(): Promise<McpTool[]> {
    if (this.toolDefs.length === 0) {
      this.toolDefs = this.buildToolDefs();
    }
    return this.toolDefs.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    if (!this.client) {
      return this.errorResponse(
        'API_KEY_REQUIRED',
        this.initError ||
          'Fakturoid API key is not configured. Format: slug:personal_access_token'
      );
    }

    const toolDef = this.toolDefs.find((t) => t.name === name);
    if (!toolDef) {
      return this.errorResponse(
        'UNKNOWN_TOOL',
        `Unknown tool: ${name}. Use listTools() to see available tools.`
      );
    }

    let parsed: unknown;
    try {
      parsed = toolDef.inputSchema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'INVALID_INPUT',
                message: 'Invalid input parameters',
                details: error.issues.map((issue) => ({
                  path: issue.path.join('.'),
                  message: issue.message,
                })),
              }),
            },
          ],
          isError: true,
        };
      }
      throw error;
    }

    try {
      const result = await toolDef.handler(parsed);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async listResources(): Promise<McpResource[]> {
    return [];
  }

  async readResource(_uri: string): Promise<unknown> {
    throw new Error('No resources available in Fakturoid MCP');
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private errorResponse(error: string, message: string) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error, message }) }],
      isError: true,
    };
  }

  private handleApiError(error: unknown) {
    if (error instanceof FakturoidApiError) {
      return this.errorResponse(error.code, error.message);
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return this.errorResponse('API_ERROR', msg);
  }

  private buildToolDefs(): ToolDef[] {
    if (!this.client) return [];
    const c = this.client;
    return [
      // ── Account ──────────────────────────────────────────────────
      {
        name: 'fakturoid_get_account',
        description: 'Get Fakturoid account details (plan, owner, settings).',
        inputSchema: EmptySchema,
        handler: () => c.getAccount(),
      },

      // ── Users & Bank Accounts ─────────────────────────────────────
      {
        name: 'fakturoid_list_users',
        description: 'List all users in the Fakturoid account.',
        inputSchema: EmptySchema,
        handler: () => c.listUsers(),
      },
      {
        name: 'fakturoid_list_bank_accounts',
        description: 'List all bank accounts configured in the Fakturoid account.',
        inputSchema: EmptySchema,
        handler: () => c.listBankAccounts(),
      },

      // ── Invoices ─────────────────────────────────────────────────
      {
        name: 'fakturoid_list_invoices',
        description:
          'List invoices with optional filtering by status, subject, date, or invoice number. Returns 20 items per page.',
        inputSchema: ListInvoicesSchema,
        handler: (args) => c.listInvoices(args as z.infer<typeof ListInvoicesSchema>),
      },
      {
        name: 'fakturoid_get_invoice',
        description: 'Get full details of a specific invoice by ID, including line items.',
        inputSchema: GetInvoiceSchema,
        handler: (args) => c.getInvoice(args as z.infer<typeof GetInvoiceSchema>),
      },
      {
        name: 'fakturoid_create_invoice',
        description:
          'Create a new invoice with line items. Requires subject_id and at least one line item with name and unit_price.',
        inputSchema: CreateInvoiceSchema,
        handler: (args) => c.createInvoice(args as Record<string, unknown>),
      },
      {
        name: 'fakturoid_update_invoice',
        description: 'Update an existing invoice. Only provided fields are updated.',
        inputSchema: UpdateInvoiceSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateInvoiceSchema>;
          return c.updateInvoice({ id }, data);
        },
      },
      {
        name: 'fakturoid_invoice_action',
        description:
          'Fire an action on an invoice: mark_as_sent, deliver (email), pay, cancel, lock, unlock, etc.',
        inputSchema: InvoiceActionSchema,
        handler: (args) => c.invoiceAction(args as z.infer<typeof InvoiceActionSchema>),
      },
      {
        name: 'fakturoid_search_invoices',
        description: 'Full-text search invoices by number, subject name, or note.',
        inputSchema: SearchInvoicesSchema,
        handler: (args) => c.searchInvoices(args as z.infer<typeof SearchInvoicesSchema>),
      },
      {
        name: 'fakturoid_delete_invoice',
        description: 'Delete an invoice by ID. Only draft invoices can be deleted.',
        inputSchema: DeleteInvoiceSchema,
        handler: (args) => c.deleteInvoice(args as z.infer<typeof DeleteInvoiceSchema>),
      },

      // ── Invoice Payments ──────────────────────────────────────────
      {
        name: 'fakturoid_create_payment',
        description: 'Create a payment for an invoice.',
        inputSchema: CreatePaymentSchema,
        handler: (args) => c.createPayment(args as z.infer<typeof CreatePaymentSchema>),
      },
      {
        name: 'fakturoid_delete_payment',
        description: 'Delete a payment from an invoice.',
        inputSchema: DeletePaymentSchema,
        handler: (args) => c.deletePayment(args as z.infer<typeof DeletePaymentSchema>),
      },

      // ── Invoice Messages ──────────────────────────────────────────
      {
        name: 'fakturoid_send_invoice_message',
        description: 'Send an invoice by email to a recipient.',
        inputSchema: SendInvoiceMessageSchema,
        handler: (args) =>
          c.sendInvoiceMessage(args as z.infer<typeof SendInvoiceMessageSchema>),
      },

      // ── Subjects (Contacts) ─────────────────────────────────────
      {
        name: 'fakturoid_list_subjects',
        description: 'List subjects (contacts/companies). Returns 20 items per page.',
        inputSchema: ListSubjectsSchema,
        handler: (args) => c.listSubjects(args as z.infer<typeof ListSubjectsSchema>),
      },
      {
        name: 'fakturoid_get_subject',
        description: 'Get full details of a specific subject/contact by ID.',
        inputSchema: GetSubjectSchema,
        handler: (args) => c.getSubject(args as z.infer<typeof GetSubjectSchema>),
      },
      {
        name: 'fakturoid_create_subject',
        description:
          'Create a new subject/contact. Supports Czech business fields (ICO, DIC, bank account, IBAN).',
        inputSchema: CreateSubjectSchema,
        handler: (args) => c.createSubject(args as Record<string, unknown>),
      },
      {
        name: 'fakturoid_search_subjects',
        description: 'Search subjects by name, registration number (ICO), or other fields.',
        inputSchema: SearchSubjectsSchema,
        handler: (args) => c.searchSubjects(args as z.infer<typeof SearchSubjectsSchema>),
      },
      {
        name: 'fakturoid_update_subject',
        description: 'Update an existing subject/contact. Only provided fields are updated.',
        inputSchema: UpdateSubjectSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateSubjectSchema>;
          return c.updateSubject({ id }, data);
        },
      },
      {
        name: 'fakturoid_delete_subject',
        description: 'Delete a subject/contact by ID.',
        inputSchema: DeleteSubjectSchema,
        handler: (args) => c.deleteSubject(args as z.infer<typeof DeleteSubjectSchema>),
      },

      // ── Expenses ─────────────────────────────────────────────────
      {
        name: 'fakturoid_list_expenses',
        description:
          'List expenses with optional filtering by status, subject, or date. Returns 20 items per page.',
        inputSchema: ListExpensesSchema,
        handler: (args) => c.listExpenses(args as z.infer<typeof ListExpensesSchema>),
      },
      {
        name: 'fakturoid_create_expense',
        description: 'Create a new expense record with line items.',
        inputSchema: CreateExpenseSchema,
        handler: (args) => c.createExpense(args as Record<string, unknown>),
      },
      {
        name: 'fakturoid_get_expense',
        description: 'Get full details of a specific expense by ID.',
        inputSchema: GetExpenseSchema,
        handler: (args) => c.getExpense(args as z.infer<typeof GetExpenseSchema>),
      },
      {
        name: 'fakturoid_update_expense',
        description: 'Update an existing expense. Only provided fields are updated.',
        inputSchema: UpdateExpenseSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateExpenseSchema>;
          return c.updateExpense({ id }, data);
        },
      },
      {
        name: 'fakturoid_search_expenses',
        description: 'Full-text search expenses.',
        inputSchema: SearchExpensesSchema,
        handler: (args) => c.searchExpenses(args as z.infer<typeof SearchExpensesSchema>),
      },

      // ── Expense Payments ──────────────────────────────────────────
      {
        name: 'fakturoid_create_expense_payment',
        description: 'Create a payment for an expense.',
        inputSchema: CreateExpensePaymentSchema,
        handler: (args) =>
          c.createExpensePayment(args as z.infer<typeof CreateExpensePaymentSchema>),
      },
      {
        name: 'fakturoid_delete_expense_payment',
        description: 'Delete a payment from an expense.',
        inputSchema: DeleteExpensePaymentSchema,
        handler: (args) =>
          c.deleteExpensePayment(args as z.infer<typeof DeleteExpensePaymentSchema>),
      },

      // ── Inventory Items ───────────────────────────────────────────
      {
        name: 'fakturoid_list_inventory_items',
        description: 'List inventory items. Returns 20 items per page.',
        inputSchema: ListInventoryItemsSchema,
        handler: (args) =>
          c.listInventoryItems(args as z.infer<typeof ListInventoryItemsSchema>),
      },
      {
        name: 'fakturoid_get_inventory_item',
        description: 'Get full details of a specific inventory item by ID.',
        inputSchema: GetInventoryItemSchema,
        handler: (args) => c.getInventoryItem(args as z.infer<typeof GetInventoryItemSchema>),
      },
      {
        name: 'fakturoid_create_inventory_item',
        description:
          'Create a new inventory item with name, SKU, prices, and VAT rate.',
        inputSchema: CreateInventoryItemSchema,
        handler: (args) => c.createInventoryItem(args as Record<string, unknown>),
      },
      {
        name: 'fakturoid_update_inventory_item',
        description: 'Update an existing inventory item. Only provided fields are updated.',
        inputSchema: UpdateInventoryItemSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateInventoryItemSchema>;
          return c.updateInventoryItem({ id }, data);
        },
      },
      {
        name: 'fakturoid_search_inventory_items',
        description: 'Search inventory items by name, SKU, or article number.',
        inputSchema: SearchInventoryItemsSchema,
        handler: (args) =>
          c.searchInventoryItems(args as z.infer<typeof SearchInventoryItemsSchema>),
      },

      // ── Inventory Moves ───────────────────────────────────────────
      {
        name: 'fakturoid_list_inventory_moves',
        description:
          'List inventory moves with optional filtering by item or date. Returns 20 items per page.',
        inputSchema: ListInventoryMovesSchema,
        handler: (args) =>
          c.listInventoryMoves(args as z.infer<typeof ListInventoryMovesSchema>),
      },
      {
        name: 'fakturoid_create_inventory_move',
        description:
          'Create an inventory move (stock in or out) for a specific inventory item.',
        inputSchema: CreateInventoryMoveSchema,
        handler: (args) =>
          c.createInventoryMove(args as z.infer<typeof CreateInventoryMoveSchema>),
      },

      // ── Generators (Invoice Templates) ────────────────────────────
      {
        name: 'fakturoid_list_generators',
        description: 'List invoice generators/templates. Returns 20 items per page.',
        inputSchema: ListGeneratorsSchema,
        handler: (args) => c.listGenerators(args as z.infer<typeof ListGeneratorsSchema>),
      },
      {
        name: 'fakturoid_get_generator',
        description: 'Get full details of a specific generator/template by ID.',
        inputSchema: GetGeneratorSchema,
        handler: (args) => c.getGenerator(args as z.infer<typeof GetGeneratorSchema>),
      },
      {
        name: 'fakturoid_create_generator',
        description: 'Create a new invoice generator/template.',
        inputSchema: CreateGeneratorSchema,
        handler: (args) => c.createGenerator(args as Record<string, unknown>),
      },

      // ── Recurring Generators ──────────────────────────────────────
      {
        name: 'fakturoid_list_recurring_generators',
        description: 'List recurring invoice generators. Returns 20 items per page.',
        inputSchema: ListRecurringGeneratorsSchema,
        handler: (args) =>
          c.listRecurringGenerators(args as z.infer<typeof ListRecurringGeneratorsSchema>),
      },
      {
        name: 'fakturoid_get_recurring_generator',
        description: 'Get full details of a specific recurring generator by ID.',
        inputSchema: GetRecurringGeneratorSchema,
        handler: (args) =>
          c.getRecurringGenerator(args as z.infer<typeof GetRecurringGeneratorSchema>),
      },

      // ── Events (Audit Log) ────────────────────────────────────────
      {
        name: 'fakturoid_list_events',
        description:
          'List account events/audit log. Filter by date or subject. Returns 20 items per page.',
        inputSchema: ListEventsSchema,
        handler: (args) => c.listEvents(args as z.infer<typeof ListEventsSchema>),
      },

      // ── Todos ─────────────────────────────────────────────────────
      {
        name: 'fakturoid_list_todos',
        description: 'List todos/tasks. Returns 20 items per page.',
        inputSchema: ListTodosSchema,
        handler: (args) => c.listTodos(args as z.infer<typeof ListTodosSchema>),
      },
      {
        name: 'fakturoid_toggle_todo',
        description: 'Toggle the completion status of a todo.',
        inputSchema: ToggleTodoSchema,
        handler: (args) => c.toggleTodo(args as z.infer<typeof ToggleTodoSchema>),
      },

      // ── Tags ─────────────────────────────────────────────────────
      {
        name: 'fakturoid_list_tags',
        description: 'List all tags used in the Fakturoid account.',
        inputSchema: EmptySchema,
        handler: () => c.listTags(),
      },
    ];
  }
}
