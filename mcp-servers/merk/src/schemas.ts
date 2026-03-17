/**
 * Zod input schemas for all Merk MCP tools
 */

import { z } from 'zod';

const CountryCodeSchema = z.enum(['cz', 'sk']);
const RelationTypeSchema = z.enum(['current', 'historical', 'any']);
const NodeLabelSchema = z.enum(['company', 'person']);

export const CompanyLookupSchema = z
  .object({
    regno: z.string().optional().describe('Company registration number (IČO)'),
    vatno: z.string().optional().describe('VAT number (DIČ)'),
    country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
    src_app: z.string().optional().describe('Optional application identifier'),
  })
  .refine((data) => data.regno || data.vatno, {
    message: 'Either regno or vatno must be provided',
  });

export const CompanyBatchSchema = z.object({
  regnos: z.array(z.string()).min(1).max(500).describe('Array of registration numbers (max 500)'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
  src_app: z.string().optional().describe('Optional application identifier'),
});

export const SuggestSchema = z
  .object({
    query: z.string().optional().describe('Compatibility alias for company name search'),
    country: CountryCodeSchema.optional().describe('Compatibility alias for country_code'),
    name: z.string().optional().describe('Company name to search for'),
    email: z.string().optional().describe('Email address to search for'),
    bank_account: z.string().optional().describe('Bank account number to search for'),
    regno: z.string().optional().describe('Registration number (IČO) — exact or partial match'),
    only_active: z.boolean().optional().describe('Return only active companies'),
    country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
    sort_by: z
      .enum(['fulltext_score', 'name', 'turnover', 'turnover_name'])
      .optional()
      .describe('Sort results by: fulltext_score (default), name, turnover, turnover_name'),
    birth_date: z.string().optional().describe('Birth date (YYYY-MM-DD) for person search'),
    expand_regno: z.boolean().optional().describe('Enable partial regno matching'),
    include_historic: z.boolean().optional().describe('Include historic/inactive companies'),
  })
  .refine((data) => data.name || data.query || data.email || data.bank_account || data.regno, {
    message: 'At least one lookup field must be provided',
  });

export const SearchCompaniesSchema = z
  .object({
    country: CountryCodeSchema.default('cz').describe(
      'Country: cz (Czech Republic) or sk (Slovakia)'
    ),
    country_code: CountryCodeSchema.optional().describe('Compatibility alias for country'),
    query: z.string().optional().describe('Full-text company name search'),
    ordering: z.array(z.string()).optional().describe('Sort order array'),
    filters: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Compatibility wrapper for legacy search filters'),
    page: z.number().int().positive().optional().describe('Page number'),
    page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
    limit: z.number().int().positive().max(500).optional().describe('Compatibility alias for page_size'),
    industry: z.array(z.string()).optional().describe('Primary industries'),
    industry2025: z.array(z.string()).optional().describe('Primary industries (2025 taxonomy)'),
    also_secondary_industry: z.boolean().optional().describe('Include secondary industries'),
    postal_codes: z.array(z.string()).optional().describe('Postal code filters'),
    district: z.array(z.string()).optional().describe('District filters'),
    distance: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
        distance: z.number(),
      })
      .optional()
      .describe('Distance-based search'),
    address: z.string().min(1).optional().describe('Address text filter'),
    include_premises: z.boolean().optional().describe('Include premises in location search'),
    magnitude_from: z.string().min(1).optional().describe('Company magnitude lower bound'),
    magnitude_to: z.string().min(1).optional().describe('Company magnitude upper bound'),
    magnitude_trend: z.array(z.string()).optional().describe('Magnitude trend filters'),
    turnover_from: z.string().min(1).optional().describe('Company turnover lower bound'),
    turnover_to: z.string().min(1).optional().describe('Company turnover upper bound'),
    turnover_trend: z.array(z.string()).optional().describe('Turnover trend filters'),
    profit_from: z.number().int().optional().describe('Profit lower bound'),
    profit_to: z.number().int().optional().describe('Profit upper bound'),
    profit_trend: z.array(z.string()).optional().describe('Profit trend filters'),
    estab_date_from: z.string().optional().describe('Establishment date lower bound'),
    estab_date_to: z.string().optional().describe('Establishment date upper bound'),
    active_job_ads_count_from: z.number().int().nonnegative().optional().describe('Minimum active job ads'),
    active_job_ads_count_to: z.number().int().nonnegative().optional().describe('Maximum active job ads'),
    categories: z.array(z.number().int()).optional().describe('Category filters'),
  })
  .passthrough();

export const RegnoSchema = z.object({
  regno: z.string().min(1).describe('Company registration number (IČO)'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
});

export const RegnoWithPaginationSchema = z.object({
  regno: z.string().min(1).describe('Company registration number (IČO)'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
  page: z.number().int().positive().optional().describe('Page number'),
  page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
});

export const CompanyEventsSchema = z.object({
  regno: z.string().min(1).optional().describe('Company registration number (IČO)'),
  from_date: z.string().min(1).describe('Start date (YYYY-MM-DD) — required'),
  to_date: z.string().min(1).describe('End date (YYYY-MM-DD) — required'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
  action_id: z.number().int().optional().describe('Filter by action ID'),
  event_id: z.number().int().optional().describe('Filter by event ID'),
});

export const DateRangeSchema = z.object({
  from_date: z.string().min(1).describe('Start date (YYYY-MM-DD)'),
  to_date: z.string().min(1).describe('End date (YYYY-MM-DD)'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
  page: z.number().int().positive().optional().describe('Page number'),
  page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
});

export const RelationsCompanySchema = z
  .object({
    company_id: z
      .string()
      .min(1)
      .optional()
      .describe('Company node ID in format "{country_code}-{regno}" (e.g. "cz-12345678")'),
    regno: z.string().min(1).optional().describe('Compatibility alias used to build company_id'),
    relation_type: RelationTypeSchema.describe('Relation type filter: current, historical, or any'),
    country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
    hops: z.number().int().min(1).max(2).optional().describe('Number of hops (1-2, default: 1)'),
    from_date_gte: z.string().optional().describe('Filter relations from date (YYYY-MM-DD)'),
    to_date_lte: z.string().optional().describe('Filter relations to date (YYYY-MM-DD)'),
    share_gte: z.number().optional().describe('Minimum ownership share percentage'),
    company_role_id: z.number().int().optional().describe('Filter by company role ID'),
  })
  .refine((data) => data.company_id || data.regno, {
    message: 'Either company_id or regno must be provided',
  });

export const RelationsPersonSchema = z.object({
  person_id: z.string().min(1).describe('Person node ID in relations graph'),
  relation_type: RelationTypeSchema.describe('Relation type filter: current, historical, or any'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
  hops: z.number().int().min(1).max(2).optional().describe('Number of hops (1-2, default: 1)'),
  from_date_gte: z.string().optional().describe('Filter relations from date (YYYY-MM-DD)'),
  to_date_lte: z.string().optional().describe('Filter relations to date (YYYY-MM-DD)'),
  share_gte: z.number().optional().describe('Minimum ownership share percentage'),
  company_role_id: z.number().int().optional().describe('Filter by company role ID'),
});

export const RelationsSearchPersonSchema = z.object({
  name: z.string().min(1).describe('Person name to search for'),
  birth_date: z.string().optional().describe('Birth date (YYYY-MM-DD)'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
});

export const RelationsShortestPathSchema = z.object({
  node1_id: z.string().min(1).describe('First node ID'),
  node1_label: NodeLabelSchema.describe('First node type: company or person'),
  node2_id: z.string().min(1).describe('Second node ID'),
  node2_label: NodeLabelSchema.describe('Second node type: company or person'),
  relation_type: RelationTypeSchema.describe('Relation type filter: current, historical, or any'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
  hops: z.number().int().min(1).max(3).optional().describe('Max hops (1-3, default: 1)'),
});

export const EnumsSchema = z.object({
  id: z.string().optional().describe('Specific enum ID to retrieve. Omit to list all enums.'),
  enum_id: z.string().optional().describe('Specific enum ID to retrieve. Omit to list all enums.'),
  country_code: CountryCodeSchema.optional().describe('Country code: cz or sk'),
});

export const SubscriptionInfoSchema = z.object({});

export const VokativSchema = z
  .object({
    first_name: z.string().min(1).optional().describe('First name'),
    last_name: z.string().min(1).optional().describe('Last name'),
  })
  .refine((data) => data.first_name || data.last_name, {
    message: 'Either first_name or last_name must be provided',
  });
