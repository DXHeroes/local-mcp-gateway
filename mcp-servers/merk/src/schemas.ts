/**
 * Zod input schemas for all Merk MCP tools
 */

import { z } from 'zod';

export const CompanyLookupSchema = z
  .object({
    regno: z.string().optional().describe('Company registration number (IČO)'),
    vatno: z.string().optional().describe('VAT number (DIČ)'),
    country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  })
  .refine((data) => data.regno || data.vatno, {
    message: 'Either regno or vatno must be provided',
  });

export const CompanyBatchSchema = z.object({
  regnos: z.array(z.string()).min(1).max(500).describe('Array of registration numbers (max 500)'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
});

export const SuggestSchema = z.object({
  name: z.string().optional().describe('Company name to search for'),
  email: z.string().optional().describe('Email address to search for'),
  bank_account: z.string().optional().describe('Bank account number to search for'),
  regno: z.string().optional().describe('Registration number (IČO) — exact or partial match'),
  only_active: z.boolean().optional().describe('Return only active companies'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  sort_by: z
    .enum(['fulltext_score', 'name', 'turnover', 'turnover_name'])
    .optional()
    .describe('Sort results by: fulltext_score (default), name, turnover, turnover_name'),
  birth_date: z.string().optional().describe('Birth date (YYYY-MM-DD) for person search'),
  expand_regno: z.boolean().optional().describe('Enable partial regno matching'),
  include_historic: z.boolean().optional().describe('Include historic/inactive companies'),
});

export const SearchCompaniesSchema = z.object({
  country: z.enum(['cz', 'sk']).describe('Country: cz (Czech Republic) or sk (Slovakia)'),
  query: z.string().optional().describe('Full-text company name search'),
  ordering: z
    .array(z.string())
    .optional()
    .describe(
      'Sort order — e.g. ["-turnover_id", "name"]. Options: turnover_id, magnitude_id, name, municipality (prefix with - for descending)'
    ),
  filters: z
    .record(z.string(), z.unknown())
    .optional()
    .default({})
    .describe('Search filters object (see Merk API docs for available filters)'),
  page: z.number().int().positive().optional().describe('Page number'),
  page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
});

export const RegnoSchema = z.object({
  regno: z.string().min(1).describe('Company registration number (IČO)'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
});

export const RegnoWithPaginationSchema = z.object({
  regno: z.string().min(1).describe('Company registration number (IČO)'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  page: z.number().int().positive().optional().describe('Page number'),
  page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
});

export const CompanyEventsSchema = z.object({
  regno: z.string().min(1).describe('Company registration number (IČO)'),
  from_date: z.string().min(1).describe('Start date (YYYY-MM-DD) — required'),
  to_date: z.string().min(1).describe('End date (YYYY-MM-DD) — required'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  action_id: z.number().int().optional().describe('Filter by action ID'),
  event_id: z.number().int().optional().describe('Filter by event ID'),
});

export const DateRangeSchema = z.object({
  from_date: z.string().min(1).describe('Start date (YYYY-MM-DD)'),
  to_date: z.string().min(1).describe('End date (YYYY-MM-DD)'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  page: z.number().int().positive().optional().describe('Page number'),
  page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
});

export const RelationsCompanySchema = z.object({
  company_id: z
    .string()
    .min(1)
    .describe('Company node ID in format "{country_code}-{regno}" (e.g. "cz-12345678")'),
  relation_type: z
    .enum(['current', 'historical', 'any'])
    .describe('Relation type filter: current, historical, or any'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  hops: z.number().int().min(1).max(2).optional().describe('Number of hops (1-2, default: 1)'),
  from_date_gte: z.string().optional().describe('Filter relations from date (YYYY-MM-DD)'),
  to_date_lte: z.string().optional().describe('Filter relations to date (YYYY-MM-DD)'),
  share_gte: z.number().optional().describe('Minimum ownership share percentage'),
  company_role_id: z.number().int().optional().describe('Filter by company role ID'),
});

export const RelationsPersonSchema = z.object({
  person_id: z.string().min(1).describe('Person node ID in relations graph'),
  relation_type: z
    .enum(['current', 'historical', 'any'])
    .describe('Relation type filter: current, historical, or any'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  hops: z.number().int().min(1).max(2).optional().describe('Number of hops (1-2, default: 1)'),
  from_date_gte: z.string().optional().describe('Filter relations from date (YYYY-MM-DD)'),
  to_date_lte: z.string().optional().describe('Filter relations to date (YYYY-MM-DD)'),
  share_gte: z.number().optional().describe('Minimum ownership share percentage'),
  company_role_id: z.number().int().optional().describe('Filter by company role ID'),
});

export const RelationsSearchPersonSchema = z.object({
  name: z.string().min(1).describe('Person name to search for'),
  birth_date: z.string().optional().describe('Birth date (YYYY-MM-DD)'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
});

export const RelationsShortestPathSchema = z.object({
  node1_id: z.string().min(1).describe('First node ID'),
  node1_label: z.enum(['company', 'person']).describe('First node type: company or person'),
  node2_id: z.string().min(1).describe('Second node ID'),
  node2_label: z.enum(['company', 'person']).describe('Second node type: company or person'),
  relation_type: z
    .enum(['current', 'historical', 'any'])
    .describe('Relation type filter: current, historical, or any'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  hops: z.number().int().min(1).max(3).optional().describe('Max hops (1-3, default: 1)'),
});

export const EnumsSchema = z.object({
  enum_id: z.string().optional().describe('Specific enum ID to retrieve. Omit to list all enums.'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
});

export const SubscriptionInfoSchema = z.object({});

export const VokativSchema = z.object({
  first_name: z.string().optional().describe('First name'),
  last_name: z.string().optional().describe('Last name'),
});
