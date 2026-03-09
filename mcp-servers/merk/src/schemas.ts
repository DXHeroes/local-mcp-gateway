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
});

export const SuggestSchema = z.object({
  name: z.string().optional().describe('Company name to search for'),
  email: z.string().optional().describe('Email address to search for'),
  bank_account: z.string().optional().describe('Bank account number to search for'),
  only_active: z.boolean().optional().describe('Return only active companies'),
});

export const SearchCompaniesSchema = z.object({
  country: z.enum(['cz', 'sk']).describe('Country: cz (Czech Republic) or sk (Slovakia)'),
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
});

export const RegnoWithPaginationSchema = z.object({
  regno: z.string().min(1).describe('Company registration number (IČO)'),
  page: z.number().int().positive().optional().describe('Page number'),
  page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
});

export const CompanyEventsSchema = z.object({
  regno: z.string().min(1).describe('Company registration number (IČO)'),
  from_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
});

export const DateRangeSchema = z.object({
  from_date: z.string().min(1).describe('Start date (YYYY-MM-DD)'),
  to_date: z.string().min(1).describe('End date (YYYY-MM-DD)'),
  country_code: z.enum(['cz', 'sk']).optional().describe('Country code: cz or sk'),
  page: z.number().int().positive().optional().describe('Page number'),
  page_size: z.number().int().positive().max(500).optional().describe('Items per page'),
});

export const RelationsCompanySchema = z.object({
  company_id: z.string().min(1).describe('Company node ID in relations graph'),
  relation_type: z.string().optional().describe('Filter by relation type'),
});

export const RelationsPersonSchema = z.object({
  person_id: z.string().min(1).describe('Person node ID in relations graph'),
  relation_type: z.string().optional().describe('Filter by relation type'),
});

export const RelationsSearchPersonSchema = z.object({
  name: z.string().min(1).describe('Person name to search for'),
  birth_date: z.string().optional().describe('Birth date (YYYY-MM-DD)'),
});

export const RelationsShortestPathSchema = z.object({
  node1_id: z.string().min(1).describe('First node ID'),
  node1_label: z.string().min(1).describe('First node label (company or person)'),
  node2_id: z.string().min(1).describe('Second node ID'),
  node2_label: z.string().min(1).describe('Second node label (company or person)'),
  relation_type: z.string().optional().describe('Filter by relation type'),
});

export const EnumsSchema = z.object({
  enum_id: z.string().optional().describe('Specific enum ID to retrieve. Omit to list all enums.'),
});

export const SubscriptionInfoSchema = z.object({});

export const VokativSchema = z.object({
  first_name: z.string().min(1).describe('First name'),
  last_name: z.string().min(1).describe('Last name'),
});
