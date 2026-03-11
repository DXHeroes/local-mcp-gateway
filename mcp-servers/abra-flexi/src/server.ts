/**
 * Abra Flexi MCP Server
 *
 * Wraps the Abra Flexi REST API.
 * Provides 30 tools covering invoices, contacts, products, orders, bank statements, and generic records.
 */

import type { ApiKeyConfig, McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { McpServer } from '@dxheroes/local-mcp-core';
import { z } from 'zod';
import { FlexiApiError, FlexiClient } from './client.js';
import {
  CreateContactSchema,
  CreateInternalDocumentSchema,
  CreateIssuedInvoiceSchema,
  CreateOrderIssuedSchema,
  CreateOrderReceivedSchema,
  CreateProductSchema,
  CreateReceivedInvoiceSchema,
  CreateRecordSchema,
  DeleteRecordSchema,
  EmptySchema,
  GetContactSchema,
  GetIssuedInvoiceSchema,
  GetReceivedInvoiceSchema,
  GetRecordSchema,
  ListBankStatementsSchema,
  ListCashMovementsSchema,
  ListContactsSchema,
  ListInternalDocumentsSchema,
  ListIssuedInvoicesSchema,
  ListOrdersIssuedSchema,
  ListOrdersReceivedSchema,
  ListProductsSchema,
  ListReceivedInvoicesSchema,
  ListRecordsSchema,
  ListStockMovementsSchema,
  UpdateContactSchema,
  UpdateIssuedInvoiceSchema,
  UpdateProductSchema,
  UpdateReceivedInvoiceSchema,
  UpdateRecordSchema,
} from './schemas.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (args: unknown) => Promise<unknown>;
}

export class FlexiMcpServer extends McpServer {
  private client: FlexiClient | null = null;
  private initError: string | null = null;
  private toolDefs: ToolDef[] = [];

  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> {
    if (!this.apiKeyConfig?.apiKey) {
      this.initError =
        'Abra Flexi API key is not configured. Please configure the API key in the MCP server settings. Format: https://server/c/company|username:password';
      console.warn('[Flexi] No API key configured');
      return;
    }

    try {
      this.client = new FlexiClient(this.apiKeyConfig.apiKey);
      this.initError = null;
      this.toolDefs = this.buildToolDefs();
    } catch (error) {
      this.initError = `Failed to initialize Flexi client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Flexi] Initialization error:', error);
    }
  }

  override async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKeyConfig?.apiKey) {
      return { valid: false, error: 'API key not configured' };
    }

    try {
      const client = new FlexiClient(this.apiKeyConfig.apiKey);
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
          'Abra Flexi API key is not configured. Format: https://server/c/company|username:password'
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
    throw new Error('No resources available in Abra Flexi MCP');
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private errorResponse(error: string, message: string) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error, message }) }],
      isError: true,
    };
  }

  private handleApiError(error: unknown) {
    if (error instanceof FlexiApiError) {
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
        name: 'flexi_get_account_info',
        description: 'Get Flexi company/account information (name, IC, DIC, address, settings).',
        inputSchema: EmptySchema,
        handler: () => c.getAccountInfo(),
      },

      // ── Issued Invoices (faktura-vydana) ─────────────────────────
      {
        name: 'flexi_list_issued_invoices',
        description:
          'List issued invoices (faktury vydane). Supports filtering, pagination, and sorting.',
        inputSchema: ListIssuedInvoicesSchema,
        handler: (args) =>
          c.listIssuedInvoices(args as z.infer<typeof ListIssuedInvoicesSchema>),
      },
      {
        name: 'flexi_get_issued_invoice',
        description: 'Get details of a specific issued invoice by ID or code.',
        inputSchema: GetIssuedInvoiceSchema,
        handler: (args) => {
          const { id } = args as z.infer<typeof GetIssuedInvoiceSchema>;
          return c.getIssuedInvoice(id);
        },
      },
      {
        name: 'flexi_create_issued_invoice',
        description:
          'Create a new issued invoice (faktura vydana). Fields use Czech names: firma (contact), datVyst (issue date), polozkyFaktury (line items).',
        inputSchema: CreateIssuedInvoiceSchema,
        handler: (args) => c.createIssuedInvoice(args as Record<string, unknown>),
      },
      {
        name: 'flexi_update_issued_invoice',
        description:
          'Update an existing issued invoice (faktura vydana) by ID or code. Only provided fields are updated.',
        inputSchema: UpdateIssuedInvoiceSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateIssuedInvoiceSchema>;
          return c.updateIssuedInvoice(id, data as Record<string, unknown>);
        },
      },

      // ── Received Invoices (faktura-prijata) ──────────────────────
      {
        name: 'flexi_list_received_invoices',
        description:
          'List received invoices (faktury prijate). Supports filtering, pagination, and sorting.',
        inputSchema: ListReceivedInvoicesSchema,
        handler: (args) =>
          c.listReceivedInvoices(args as z.infer<typeof ListReceivedInvoicesSchema>),
      },
      {
        name: 'flexi_get_received_invoice',
        description: 'Get details of a specific received invoice by ID or code.',
        inputSchema: GetReceivedInvoiceSchema,
        handler: (args) => {
          const { id } = args as z.infer<typeof GetReceivedInvoiceSchema>;
          return c.getReceivedInvoice(id);
        },
      },
      {
        name: 'flexi_create_received_invoice',
        description:
          'Create a new received invoice (faktura prijata) from a supplier.',
        inputSchema: CreateReceivedInvoiceSchema,
        handler: (args) => c.createReceivedInvoice(args as Record<string, unknown>),
      },
      {
        name: 'flexi_update_received_invoice',
        description:
          'Update an existing received invoice (faktura prijata) by ID or code. Only provided fields are updated.',
        inputSchema: UpdateReceivedInvoiceSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateReceivedInvoiceSchema>;
          return c.updateReceivedInvoice(id, data as Record<string, unknown>);
        },
      },

      // ── Contacts (adresar) ──────────────────────────────────────
      {
        name: 'flexi_list_contacts',
        description:
          'List contacts from the address book (adresar). Supports filtering by name, IC, etc.',
        inputSchema: ListContactsSchema,
        handler: (args) => c.listContacts(args as z.infer<typeof ListContactsSchema>),
      },
      {
        name: 'flexi_get_contact',
        description: 'Get details of a specific contact by ID or code.',
        inputSchema: GetContactSchema,
        handler: (args) => {
          const { id } = args as z.infer<typeof GetContactSchema>;
          return c.getContact(id);
        },
      },
      {
        name: 'flexi_create_contact',
        description:
          'Create a new contact in the address book. Fields use Czech names: nazev (name), ulice (street), ic (ICO), dic (DIC).',
        inputSchema: CreateContactSchema,
        handler: (args) => c.createContact(args as Record<string, unknown>),
      },
      {
        name: 'flexi_update_contact',
        description:
          'Update an existing contact in the address book by ID or code. Only provided fields are updated.',
        inputSchema: UpdateContactSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateContactSchema>;
          return c.updateContact(id, data as Record<string, unknown>);
        },
      },

      // ── Bank Statements (banka) ─────────────────────────────────
      {
        name: 'flexi_list_bank_statements',
        description:
          'List bank statement records (banka). Supports filtering and pagination.',
        inputSchema: ListBankStatementsSchema,
        handler: (args) =>
          c.listBankStatements(args as z.infer<typeof ListBankStatementsSchema>),
      },

      // ── Products (cenik) ────────────────────────────────────────
      {
        name: 'flexi_list_products',
        description:
          'List products from the price list (cenik). Supports filtering and pagination.',
        inputSchema: ListProductsSchema,
        handler: (args) => c.listProducts(args as z.infer<typeof ListProductsSchema>),
      },
      {
        name: 'flexi_create_product',
        description:
          'Create a new product in the price list. Fields use Czech names: kod (code), nazev (name), cenaBezDph (price excl. VAT).',
        inputSchema: CreateProductSchema,
        handler: (args) => c.createProduct(args as Record<string, unknown>),
      },
      {
        name: 'flexi_update_product',
        description:
          'Update an existing product in the price list by ID or code. Only provided fields are updated.',
        inputSchema: UpdateProductSchema,
        handler: (args) => {
          const { id, ...data } = args as z.infer<typeof UpdateProductSchema>;
          return c.updateProduct(id, data as Record<string, unknown>);
        },
      },

      // ── Orders Received (objednavka-prijata) ──────────────────────
      {
        name: 'flexi_list_orders_received',
        description:
          'List received orders (objednavky prijate). Supports filtering, pagination, and sorting.',
        inputSchema: ListOrdersReceivedSchema,
        handler: (args) =>
          c.listOrdersReceived(args as z.infer<typeof ListOrdersReceivedSchema>),
      },
      {
        name: 'flexi_create_order_received',
        description:
          'Create a new received order (objednavka prijata). Fields: firma (contact), datObj (order date), polozkyObjednavky (line items).',
        inputSchema: CreateOrderReceivedSchema,
        handler: (args) => c.createOrderReceived(args as Record<string, unknown>),
      },

      // ── Orders Issued (objednavka-vydana) ─────────────────────────
      {
        name: 'flexi_list_orders_issued',
        description:
          'List issued orders (objednavky vydane). Supports filtering, pagination, and sorting.',
        inputSchema: ListOrdersIssuedSchema,
        handler: (args) =>
          c.listOrdersIssued(args as z.infer<typeof ListOrdersIssuedSchema>),
      },
      {
        name: 'flexi_create_order_issued',
        description:
          'Create a new issued order (objednavka vydana). Fields: firma (contact), datObj (order date), polozkyObjednavky (line items).',
        inputSchema: CreateOrderIssuedSchema,
        handler: (args) => c.createOrderIssued(args as Record<string, unknown>),
      },

      // ── Cash Movements (pokladni-pohyb) ───────────────────────────
      {
        name: 'flexi_list_cash_movements',
        description:
          'List cash register movements (pokladni pohyby). Supports filtering and pagination.',
        inputSchema: ListCashMovementsSchema,
        handler: (args) =>
          c.listCashMovements(args as z.infer<typeof ListCashMovementsSchema>),
      },

      // ── Internal Documents (interni-doklad) ───────────────────────
      {
        name: 'flexi_list_internal_documents',
        description:
          'List internal documents (interni doklady). Supports filtering and pagination.',
        inputSchema: ListInternalDocumentsSchema,
        handler: (args) =>
          c.listInternalDocuments(args as z.infer<typeof ListInternalDocumentsSchema>),
      },
      {
        name: 'flexi_create_internal_document',
        description:
          'Create a new internal document (interni doklad). Fields: typDokl (type), datVyst (date), polozkyIntDokl (line items with nazev, castka, ucet).',
        inputSchema: CreateInternalDocumentSchema,
        handler: (args) => c.createInternalDocument(args as Record<string, unknown>),
      },

      // ── Stock Movements (skladovy-pohyb) ──────────────────────────
      {
        name: 'flexi_list_stock_movements',
        description:
          'List stock/inventory movements (skladove pohyby). Supports filtering and pagination.',
        inputSchema: ListStockMovementsSchema,
        handler: (args) =>
          c.listStockMovements(args as z.infer<typeof ListStockMovementsSchema>),
      },

      // ── Generic Records ─────────────────────────────────────────
      {
        name: 'flexi_list_records',
        description:
          'Generic tool to list records from any Flexi evidence (endpoint). Use this for endpoints not covered by specific tools, e.g., "objednavka-prijata" (orders), "pokladna" (cash register), "strom" (tree), etc.',
        inputSchema: ListRecordsSchema,
        handler: (args) => {
          const { evidence, ...params } = args as z.infer<typeof ListRecordsSchema>;
          return c.listRecords(evidence, params);
        },
      },
      {
        name: 'flexi_get_record',
        description:
          'Generic tool to get a single record from any Flexi evidence by ID or code.',
        inputSchema: GetRecordSchema,
        handler: (args) => {
          const { evidence, id } = args as z.infer<typeof GetRecordSchema>;
          return c.getRecord(evidence, id);
        },
      },
      {
        name: 'flexi_create_record',
        description:
          'Generic tool to create a record in any Flexi evidence. Pass evidence name and data object.',
        inputSchema: CreateRecordSchema,
        handler: (args) => {
          const { evidence, data } = args as z.infer<typeof CreateRecordSchema>;
          return c.createRecord(evidence, data);
        },
      },
      {
        name: 'flexi_update_record',
        description:
          'Generic tool to update a record in any Flexi evidence by ID or code. Pass evidence name, id, and data object with fields to update.',
        inputSchema: UpdateRecordSchema,
        handler: (args) => {
          const { evidence, id, data } = args as z.infer<typeof UpdateRecordSchema>;
          return c.updateRecord(evidence, id, data);
        },
      },
      {
        name: 'flexi_delete_record',
        description:
          'Generic tool to delete a record from any Flexi evidence by ID or code.',
        inputSchema: DeleteRecordSchema,
        handler: (args) => {
          const { evidence, id } = args as z.infer<typeof DeleteRecordSchema>;
          return c.deleteRecord(evidence, id);
        },
      },
    ];
  }
}
