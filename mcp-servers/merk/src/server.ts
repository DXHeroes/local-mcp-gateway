/**
 * Merk MCP Server
 *
 * Wraps the Merk API (https://api.merk.cz/docs/) — Czech/Slovak company data platform.
 * Provides 23 tools covering company details, financials, employees, fleet, relations, and more.
 */

import type { ApiKeyConfig, McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { McpServer } from '@dxheroes/local-mcp-core';
import { z } from 'zod';
import { MerkApiError, MerkClient } from './client.js';
import {
  CompanyBatchSchema,
  CompanyEventsSchema,
  CompanyLookupSchema,
  DateRangeSchema,
  EnumsSchema,
  RegnoSchema,
  RegnoWithPaginationSchema,
  RelationsCompanySchema,
  RelationsPersonSchema,
  RelationsSearchPersonSchema,
  RelationsShortestPathSchema,
  SearchCompaniesSchema,
  SubscriptionInfoSchema,
  SuggestSchema,
  VokativSchema,
} from './schemas.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (args: unknown) => Promise<unknown>;
}

export class MerkMcpServer extends McpServer {
  private client: MerkClient | null = null;
  private initError: string | null = null;
  private toolDefs: ToolDef[] = [];

  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> {
    if (!this.apiKeyConfig?.apiKey) {
      this.initError =
        'Merk API key is not configured. Please configure the API key in the MCP server settings.';
      console.warn('[Merk] No API key configured');
      return;
    }

    try {
      this.client = new MerkClient(this.apiKeyConfig.apiKey);
      this.initError = null;
      this.toolDefs = this.buildToolDefs();
    } catch (error) {
      this.initError = `Failed to initialize Merk client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Merk] Initialization error:', error);
    }
  }

  override async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKeyConfig?.apiKey) {
      return { valid: false, error: 'API key not configured' };
    }

    try {
      const client = new MerkClient(this.apiKeyConfig.apiKey);
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
          'Merk API key is not configured. Please configure the API key in the MCP server settings.'
      );
    }

    const toolDef = this.toolDefs.find((t) => t.name === name);
    if (!toolDef) {
      return this.errorResponse(
        'UNKNOWN_TOOL',
        `Unknown tool: ${name}. Use listTools() to see available tools.`
      );
    }

    // Validate input
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

    // Execute
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
    throw new Error('No resources available in Merk MCP');
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private errorResponse(error: string, message: string) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error, message }) }],
      isError: true,
    };
  }

  private handleApiError(error: unknown) {
    if (error instanceof MerkApiError) {
      return this.errorResponse(error.code, error.message);
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return this.errorResponse('API_ERROR', msg);
  }

  private buildToolDefs(): ToolDef[] {
    if (!this.client) return [];
    const c = this.client;
    return [
      {
        name: 'merk_company_lookup',
        description:
          'Look up a Czech or Slovak company by registration number (IČO) or VAT number (DIČ). Returns detailed company information.',
        inputSchema: CompanyLookupSchema,
        handler: (args) => c.companyLookup(args as z.infer<typeof CompanyLookupSchema>),
      },
      {
        name: 'merk_company_batch',
        description:
          'Batch lookup of up to 500 companies by registration numbers. More efficient than individual lookups.',
        inputSchema: CompanyBatchSchema,
        handler: (args) => c.companyBatch(args as z.infer<typeof CompanyBatchSchema>),
      },
      {
        name: 'merk_company_suggest',
        description:
          'Suggest/autocomplete companies by name, email, or bank account number. Fast fuzzy search.',
        inputSchema: SuggestSchema,
        handler: (args) => c.suggest(args as z.infer<typeof SuggestSchema>),
      },
      {
        name: 'merk_search_companies',
        description:
          'Advanced search for Czech (cz) or Slovak (sk) companies with filters. Returns paginated results.',
        inputSchema: SearchCompaniesSchema,
        handler: (args) => c.searchCompanies(args as z.infer<typeof SearchCompaniesSchema>),
      },
      {
        name: 'merk_financial_statements',
        description:
          'Get financial statements (balance sheet, P&L) for a company by registration number.',
        inputSchema: RegnoSchema,
        handler: (args) => c.financialStatements(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_financial_indicators',
        description:
          'Get computed financial indicators (ROE, debt ratio, liquidity, etc.) for a company.',
        inputSchema: RegnoSchema,
        handler: (args) => c.financialIndicators(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_company_employees',
        description: 'Get employee count and structure for a company. Supports pagination.',
        inputSchema: RegnoWithPaginationSchema,
        handler: (args) => c.companyEmployees(args as z.infer<typeof RegnoWithPaginationSchema>),
      },
      {
        name: 'merk_company_fleet',
        description: 'Get vehicle fleet registered to a company.',
        inputSchema: RegnoSchema,
        handler: (args) => c.companyFleet(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_company_fleet_stats',
        description: 'Get fleet statistics (vehicle count by type, age, etc.) for a company.',
        inputSchema: RegnoSchema,
        handler: (args) => c.companyFleetStats(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_company_business_premises',
        description: 'Get registered business premises (provozovny) for a company.',
        inputSchema: RegnoSchema,
        handler: (args) => c.companyBusinessPremises(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_company_licenses',
        description: 'Get trade licenses (živnostenská oprávnění) for a company.',
        inputSchema: RegnoSchema,
        handler: (args) => c.companyLicenses(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_company_events',
        description:
          'Get company events (changes in registry, insolvency filings, etc.). Optionally filter by date range.',
        inputSchema: CompanyEventsSchema,
        handler: (args) => c.companyEvents(args as z.infer<typeof CompanyEventsSchema>),
      },
      {
        name: 'merk_new_companies',
        description:
          'Get newly registered companies in a date range. Supports filtering by country.',
        inputSchema: DateRangeSchema,
        handler: (args) => c.newCompanies(args as z.infer<typeof DateRangeSchema>),
      },
      {
        name: 'merk_updated_companies',
        description:
          'Get companies that were updated (changed data) in a date range. Supports filtering by country.',
        inputSchema: DateRangeSchema,
        handler: (args) => c.updatedCompanies(args as z.infer<typeof DateRangeSchema>),
      },
      {
        name: 'merk_company_job_ads',
        description: 'Get current and historical job advertisements posted by a company.',
        inputSchema: RegnoSchema,
        handler: (args) => c.companyJobAds(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_company_gov_contracts',
        description: 'Get government contracts (veřejné zakázky) associated with a company.',
        inputSchema: RegnoSchema,
        handler: (args) => c.companyGovContracts(args as z.infer<typeof RegnoSchema>),
      },
      {
        name: 'merk_relations_company',
        description:
          'Get relations graph for a company — owners, board members, subsidiaries, etc.',
        inputSchema: RelationsCompanySchema,
        handler: (args) => c.relationsCompany(args as z.infer<typeof RelationsCompanySchema>),
      },
      {
        name: 'merk_relations_person',
        description:
          'Get relations graph for a person — companies they own, boards they sit on, etc.',
        inputSchema: RelationsPersonSchema,
        handler: (args) => c.relationsPerson(args as z.infer<typeof RelationsPersonSchema>),
      },
      {
        name: 'merk_relations_search_person',
        description: 'Search for a person in the relations graph by name and optional birth date.',
        inputSchema: RelationsSearchPersonSchema,
        handler: (args) =>
          c.relationsSearchPerson(args as z.infer<typeof RelationsSearchPersonSchema>),
      },
      {
        name: 'merk_relations_shortest_path',
        description:
          'Find the shortest path between two nodes (companies/persons) in the relations graph.',
        inputSchema: RelationsShortestPathSchema,
        handler: (args) =>
          c.relationsShortestPath(args as z.infer<typeof RelationsShortestPathSchema>),
      },
      {
        name: 'merk_enums',
        description:
          'Get enum/code list values used in the API (legal forms, NACE codes, etc.). Optionally specify an enum ID.',
        inputSchema: EnumsSchema,
        handler: (args) => c.enums(args as z.infer<typeof EnumsSchema>),
      },
      {
        name: 'merk_subscription_info',
        description: 'Get your Merk API subscription info — plan, remaining credits, rate limits.',
        inputSchema: SubscriptionInfoSchema,
        handler: () => c.subscriptionInfo(),
      },
      {
        name: 'merk_vokativ',
        description:
          'Get the Czech vocative (5th grammatical case) form of a name. Useful for personalized Czech communications.',
        inputSchema: VokativSchema,
        handler: (args) => c.vokativ(args as z.infer<typeof VokativSchema>),
      },
    ];
  }
}
