/**
 * Toggl Track MCP Server
 *
 * Wraps the Toggl Track API (v9) and Reports API (v3).
 * Provides 22 tools covering time entries, projects, clients, tags, workspaces, and reports.
 */

import type { ApiKeyConfig, McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { McpServer } from '@dxheroes/local-mcp-core';
import { z } from 'zod';
import { TogglApiError, TogglClient } from './client.js';
import {
  CreateClientSchema,
  CreateProjectSchema,
  CreateTagSchema,
  CreateTimeEntrySchema,
  DeleteTimeEntrySchema,
  EmptySchema,
  GetProjectSchema,
  ListClientsSchema,
  ListProjectsSchema,
  ListTimeEntriesSchema,
  MeSchema,
  ReportDetailedSchema,
  ReportProjectSummarySchema,
  ReportSummarySchema,
  ReportWeeklySchema,
  StopTimeEntrySchema,
  UpdateClientSchema,
  UpdateProjectSchema,
  UpdateTimeEntrySchema,
  WorkspaceIdSchema,
} from './schemas.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (args: unknown) => Promise<unknown>;
}

export class TogglMcpServer extends McpServer {
  private client: TogglClient | null = null;
  private initError: string | null = null;
  private toolDefs: ToolDef[] = [];

  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> {
    if (!this.apiKeyConfig?.apiKey) {
      this.initError =
        'Toggl API token is not configured. Please configure the API token in the MCP server settings.';
      console.warn('[Toggl] No API token configured');
      return;
    }

    try {
      this.client = new TogglClient(this.apiKeyConfig.apiKey);
      this.initError = null;
      this.toolDefs = this.buildToolDefs();
    } catch (error) {
      this.initError = `Failed to initialize Toggl client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Toggl] Initialization error:', error);
    }
  }

  override async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKeyConfig?.apiKey) {
      return { valid: false, error: 'API token not configured' };
    }

    try {
      const client = new TogglClient(this.apiKeyConfig.apiKey);
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
          'Toggl API token is not configured. Please configure the API token in the MCP server settings.'
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
    throw new Error('No resources available in Toggl MCP');
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private errorResponse(error: string, message: string) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error, message }) }],
      isError: true,
    };
  }

  private handleApiError(error: unknown) {
    if (error instanceof TogglApiError) {
      return this.errorResponse(error.code, error.message);
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return this.errorResponse('API_ERROR', msg);
  }

  private buildToolDefs(): ToolDef[] {
    if (!this.client) return [];
    const c = this.client;
    return [
      // ── User & Workspace ──────────────────────────────────────────
      {
        name: 'toggl_me',
        description:
          'Get current user profile. Optionally include related data (workspaces, clients, projects).',
        inputSchema: MeSchema,
        handler: (args) => c.me(args as z.infer<typeof MeSchema>),
      },
      {
        name: 'toggl_list_workspaces',
        description: 'List all workspaces the authenticated user belongs to.',
        inputSchema: EmptySchema,
        handler: () => c.listWorkspaces(),
      },
      {
        name: 'toggl_get_workspace',
        description: 'Get details of a specific workspace by ID.',
        inputSchema: WorkspaceIdSchema,
        handler: (args) => c.getWorkspace(args as z.infer<typeof WorkspaceIdSchema>),
      },

      // ── Time Entries ──────────────────────────────────────────────
      {
        name: 'toggl_list_time_entries',
        description:
          'List time entries for the current user. Optionally filter by date range. Returns most recent entries first.',
        inputSchema: ListTimeEntriesSchema,
        handler: (args) => c.listTimeEntries(args as z.infer<typeof ListTimeEntriesSchema>),
      },
      {
        name: 'toggl_get_current_time_entry',
        description: 'Get the currently running time entry, or null if no timer is running.',
        inputSchema: EmptySchema,
        handler: () => c.getCurrentTimeEntry(),
      },
      {
        name: 'toggl_create_time_entry',
        description:
          'Create a new time entry. Set duration to -1 and start to current time to start a running timer.',
        inputSchema: CreateTimeEntrySchema,
        handler: (args) => c.createTimeEntry(args as z.infer<typeof CreateTimeEntrySchema>),
      },
      {
        name: 'toggl_update_time_entry',
        description: 'Update an existing time entry. Only provided fields are updated.',
        inputSchema: UpdateTimeEntrySchema,
        handler: (args) => c.updateTimeEntry(args as z.infer<typeof UpdateTimeEntrySchema>),
      },
      {
        name: 'toggl_stop_time_entry',
        description: 'Stop a currently running time entry.',
        inputSchema: StopTimeEntrySchema,
        handler: (args) => c.stopTimeEntry(args as z.infer<typeof StopTimeEntrySchema>),
      },
      {
        name: 'toggl_delete_time_entry',
        description: 'Delete a time entry.',
        inputSchema: DeleteTimeEntrySchema,
        handler: (args) => c.deleteTimeEntry(args as z.infer<typeof DeleteTimeEntrySchema>),
      },

      // ── Projects ──────────────────────────────────────────────────
      {
        name: 'toggl_list_projects',
        description:
          'List projects in a workspace. Optionally filter by active status. Supports pagination.',
        inputSchema: ListProjectsSchema,
        handler: (args) => c.listProjects(args as z.infer<typeof ListProjectsSchema>),
      },
      {
        name: 'toggl_get_project',
        description: 'Get details of a specific project.',
        inputSchema: GetProjectSchema,
        handler: (args) => c.getProject(args as z.infer<typeof GetProjectSchema>),
      },
      {
        name: 'toggl_create_project',
        description: 'Create a new project in a workspace.',
        inputSchema: CreateProjectSchema,
        handler: (args) => c.createProject(args as z.infer<typeof CreateProjectSchema>),
      },
      {
        name: 'toggl_update_project',
        description: 'Update an existing project. Only provided fields are updated.',
        inputSchema: UpdateProjectSchema,
        handler: (args) => c.updateProject(args as z.infer<typeof UpdateProjectSchema>),
      },

      // ── Clients ───────────────────────────────────────────────────
      {
        name: 'toggl_list_clients',
        description: 'List clients in a workspace. Optionally filter by status or name.',
        inputSchema: ListClientsSchema,
        handler: (args) => c.listClients(args as z.infer<typeof ListClientsSchema>),
      },
      {
        name: 'toggl_create_client',
        description: 'Create a new client in a workspace.',
        inputSchema: CreateClientSchema,
        handler: (args) => c.createClient(args as z.infer<typeof CreateClientSchema>),
      },
      {
        name: 'toggl_update_client',
        description: 'Update an existing client.',
        inputSchema: UpdateClientSchema,
        handler: (args) => c.updateClient(args as z.infer<typeof UpdateClientSchema>),
      },

      // ── Tags ──────────────────────────────────────────────────────
      {
        name: 'toggl_list_tags',
        description: 'List all tags in a workspace.',
        inputSchema: WorkspaceIdSchema,
        handler: (args) => c.listTags(args as z.infer<typeof WorkspaceIdSchema>),
      },
      {
        name: 'toggl_create_tag',
        description: 'Create a new tag in a workspace.',
        inputSchema: CreateTagSchema,
        handler: (args) => c.createTag(args as z.infer<typeof CreateTagSchema>),
      },

      // ── Reports ───────────────────────────────────────────────────
      {
        name: 'toggl_report_summary',
        description:
          'Get a summary report of time entries grouped by projects, clients, or users. Supports date range and filters.',
        inputSchema: ReportSummarySchema,
        handler: (args) => c.reportSummary(args as z.infer<typeof ReportSummarySchema>),
      },
      {
        name: 'toggl_report_detailed',
        description:
          'Get a detailed report of individual time entries. Supports pagination, date range, and filters.',
        inputSchema: ReportDetailedSchema,
        handler: (args) => c.reportDetailed(args as z.infer<typeof ReportDetailedSchema>),
      },
      {
        name: 'toggl_report_weekly',
        description:
          'Get a weekly report of time entries. Shows time distribution across days of the week.',
        inputSchema: ReportWeeklySchema,
        handler: (args) => c.reportWeekly(args as z.infer<typeof ReportWeeklySchema>),
      },
      {
        name: 'toggl_report_project_summary',
        description:
          'Get a project summary report with total tracked time per project in a date range.',
        inputSchema: ReportProjectSummarySchema,
        handler: (args) =>
          c.reportProjectSummary(args as z.infer<typeof ReportProjectSummarySchema>),
      },
    ];
  }
}
