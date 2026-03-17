import { describe, expect, it } from 'vitest';
import {
  CompanyEventsSchema,
  RelationsCompanySchema,
  SearchCompaniesSchema,
  SuggestSchema,
  VokativSchema,
} from '../src/schemas.js';

describe('Merk schemas', () => {
  describe('SuggestSchema', () => {
    it('accepts the screenshot alias parameters', () => {
      const result = SuggestSchema.safeParse({
        query: 'strojirenstvi vyroba Praha',
        country: 'cz',
      });

      expect(result.success).toBe(true);
    });

    it('rejects an empty suggest request', () => {
      const result = SuggestSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe('SearchCompaniesSchema', () => {
    it('accepts docs-native top-level search fields', () => {
      const result = SearchCompaniesSchema.safeParse({
        country: 'cz',
        query: 'strojirenstvi',
        ordering: ['name'],
        magnitude_from: 'small',
      });

      expect(result.success).toBe(true);
    });

    it('defaults country to cz', () => {
      const result = SearchCompaniesSchema.parse({
        query: 'vyroba',
      });

      expect(result.country).toBe('cz');
    });

    it('accepts the legacy filters wrapper for compatibility', () => {
      const result = SearchCompaniesSchema.safeParse({
        country: 'cz',
        filters: { turnover_from: 'small' },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('CompanyEventsSchema', () => {
    it('requires from_date and to_date', () => {
      const result = CompanyEventsSchema.safeParse({
        regno: '12345678',
      });

      expect(result.success).toBe(false);
    });

    it('accepts a date range without regno', () => {
      const result = CompanyEventsSchema.safeParse({
        from_date: '2024-01-01',
        to_date: '2024-01-31',
        event_id: 1,
        action_id: 2,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('RelationsCompanySchema', () => {
    it('accepts company_id with required relation_type', () => {
      const result = RelationsCompanySchema.safeParse({
        company_id: 'cz-12345678',
        relation_type: 'current',
      });

      expect(result.success).toBe(true);
    });

    it('accepts regno alias for compatibility', () => {
      const result = RelationsCompanySchema.safeParse({
        regno: '12345678',
        country_code: 'cz',
        relation_type: 'current',
      });

      expect(result.success).toBe(true);
    });

    it('rejects missing company identity', () => {
      const result = RelationsCompanySchema.safeParse({
        relation_type: 'current',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('VokativSchema', () => {
    it('allows only first_name', () => {
      const result = VokativSchema.safeParse({
        first_name: 'Jan',
      });

      expect(result.success).toBe(true);
    });

    it('rejects an empty payload', () => {
      const result = VokativSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});
