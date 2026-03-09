/**
 * Zod input schemas for all Toggl MCP tools
 */

import { z } from 'zod';

// ── User & Workspace ────────────────────────────────────────────────

export const MeSchema = z.object({
  with_related_data: z
    .boolean()
    .optional()
    .describe('Include related data (workspaces, clients, etc.)'),
});

export const EmptySchema = z.object({});

export const WorkspaceIdSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
});

// ── Time Entries ────────────────────────────────────────────────────

export const ListTimeEntriesSchema = z.object({
  start_date: z.string().optional().describe('Start date (ISO 8601, e.g. 2024-01-01)'),
  end_date: z.string().optional().describe('End date (ISO 8601, e.g. 2024-01-31)'),
});

export const CreateTimeEntrySchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  description: z.string().optional().describe('Time entry description'),
  project_id: z.number().int().positive().optional().describe('Project ID'),
  start: z.string().describe('Start time (ISO 8601, e.g. 2024-01-01T09:00:00Z)'),
  duration: z
    .number()
    .int()
    .describe('Duration in seconds. Use -1 for running timer (start must be current time)'),
  tags: z.array(z.string()).optional().describe('Tag names'),
  billable: z.boolean().optional().describe('Whether the entry is billable (premium feature)'),
  created_with: z
    .string()
    .default('mcp-toggl')
    .describe('Name of the client app that created this entry'),
});

export const UpdateTimeEntrySchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  time_entry_id: z.number().int().positive().describe('Time entry ID'),
  description: z.string().optional().describe('Time entry description'),
  project_id: z.number().int().optional().nullable().describe('Project ID (null to unset)'),
  start: z.string().optional().describe('Start time (ISO 8601)'),
  duration: z.number().int().optional().describe('Duration in seconds'),
  tags: z.array(z.string()).optional().describe('Tag names'),
  billable: z.boolean().optional().describe('Whether the entry is billable'),
});

export const StopTimeEntrySchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  time_entry_id: z.number().int().positive().describe('Time entry ID'),
});

export const DeleteTimeEntrySchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  time_entry_id: z.number().int().positive().describe('Time entry ID'),
});

// ── Projects ────────────────────────────────────────────────────────

export const ListProjectsSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  active: z.boolean().optional().describe('Filter by active status'),
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  per_page: z.number().int().positive().max(200).optional().describe('Items per page (max 200)'),
});

export const GetProjectSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  project_id: z.number().int().positive().describe('Project ID'),
});

export const CreateProjectSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  name: z.string().min(1).describe('Project name'),
  client_id: z.number().int().positive().optional().describe('Client ID'),
  active: z.boolean().optional().describe('Whether the project is active'),
  billable: z.boolean().optional().describe('Whether the project is billable'),
  color: z.string().optional().describe('Project color (hex, e.g. #FF0000)'),
});

export const UpdateProjectSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  project_id: z.number().int().positive().describe('Project ID'),
  name: z.string().min(1).optional().describe('Project name'),
  client_id: z.number().int().optional().nullable().describe('Client ID (null to unset)'),
  active: z.boolean().optional().describe('Whether the project is active'),
  billable: z.boolean().optional().describe('Whether the project is billable'),
  color: z.string().optional().describe('Project color (hex)'),
});

// ── Clients ─────────────────────────────────────────────────────────

export const ListClientsSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  status: z.string().optional().describe('Filter by status (active, archived, both)'),
  name: z.string().optional().describe('Filter by client name'),
});

export const CreateClientSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  name: z.string().min(1).describe('Client name'),
  notes: z.string().optional().describe('Notes about the client'),
});

export const UpdateClientSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  client_id: z.number().int().positive().describe('Client ID'),
  name: z.string().min(1).optional().describe('Client name'),
  notes: z.string().optional().describe('Notes about the client'),
});

// ── Tags ────────────────────────────────────────────────────────────

export const CreateTagSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  name: z.string().min(1).describe('Tag name'),
});

// ── Reports (shared filters) ────────────────────────────────────────

const ReportFilters = {
  user_ids: z.array(z.number().int()).optional().describe('Filter by user IDs'),
  project_ids: z.array(z.number().int()).optional().describe('Filter by project IDs'),
  client_ids: z.array(z.number().int()).optional().describe('Filter by client IDs'),
  tag_ids: z.array(z.number().int()).optional().describe('Filter by tag IDs'),
  billable: z.boolean().optional().describe('Filter by billable status'),
};

export const ReportSummarySchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  start_date: z.string().min(1).describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().min(1).describe('End date (YYYY-MM-DD)'),
  grouping: z.string().optional().describe('Group by (projects, clients, users)'),
  sub_grouping: z
    .string()
    .optional()
    .describe('Sub-group by (projects, clients, users, time_entries)'),
  ...ReportFilters,
});

export const ReportDetailedSchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  start_date: z.string().min(1).describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().min(1).describe('End date (YYYY-MM-DD)'),
  page_size: z.number().int().positive().max(200).optional().describe('Items per page (max 200)'),
  first_row_number: z.number().int().min(0).optional().describe('First row number for pagination'),
  ...ReportFilters,
});

export const ReportWeeklySchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  start_date: z.string().min(1).describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().min(1).describe('End date (YYYY-MM-DD)'),
  ...ReportFilters,
});

export const ReportProjectSummarySchema = z.object({
  workspace_id: z.number().int().positive().describe('Workspace ID'),
  start_date: z.string().min(1).describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().min(1).describe('End date (YYYY-MM-DD)'),
});
