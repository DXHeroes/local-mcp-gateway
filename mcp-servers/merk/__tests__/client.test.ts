/**
 * Unit tests for MerkClient
 *
 * Tests mock global.fetch to verify HTTP requests are constructed correctly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MerkApiError, MerkClient } from '../src/client.js';

const mockFetch = vi.fn();

describe('MerkClient', () => {
  let client: MerkClient;

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    client = new MerkClient('test-api-key-123');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Helper to create a mock Response
  function mockResponse(data: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    };
  }

  describe('constructor', () => {
    it('should store apiKey and use default baseUrl', () => {
      const c = new MerkClient('my-key');
      // Verify by making a request and checking the URL
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      c.subscriptionInfo();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.merk.cz'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Token my-key',
          }),
        })
      );
    });

    it('should allow custom baseUrl', () => {
      const c = new MerkClient('my-key', 'https://custom.api.com');
      mockFetch.mockResolvedValue(mockResponse({}));
      c.subscriptionInfo();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://custom.api.com'),
        expect.any(Object)
      );
    });
  });

  describe('validateApiKey', () => {
    it('should return valid: true on 200 response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ plan: 'pro' }));
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/subscriptions/',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Token test-api-key-123' },
        })
      );
    });

    it('should return invalid on 401 response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Invalid token' }, 401));
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Invalid API key' });
    });

    it('should return invalid on 403 response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Forbidden' }, 403));
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Invalid API key' });
    });

    it('should return error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await client.validateApiKey();
      expect(result).toEqual({ valid: false, error: 'Validation failed: ECONNREFUSED' });
    });
  });

  describe('companyLookup', () => {
    it('should call GET /company/ with regno query param', async () => {
      const mockData = { regno: '12345678', name: 'Test Corp' };
      mockFetch.mockResolvedValue(mockResponse(mockData));

      const result = await client.companyLookup({ regno: '12345678' });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/?regno=12345678',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should support vatno param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ vatno: 'CZ12345678' }));
      await client.companyLookup({ vatno: 'CZ12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/?vatno=CZ12345678',
        expect.any(Object)
      );
    });

    it('should support country_code param', async () => {
      mockFetch.mockResolvedValue(mockResponse({}));
      await client.companyLookup({ regno: '123', country_code: 'sk' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/?regno=123&country_code=sk',
        expect.any(Object)
      );
    });

    it('should throw MerkApiError on 404', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Not found' }, 404));
      await expect(client.companyLookup({ regno: '99999999' })).rejects.toThrow(MerkApiError);
      await expect(client.companyLookup({ regno: '99999999' })).rejects.toThrow(/NOT_FOUND/);
    });
  });

  describe('companyBatch', () => {
    it('should call POST /company/mget/ with regnos body', async () => {
      const mockData = { results: [{ regno: '1' }, { regno: '2' }] };
      mockFetch.mockResolvedValue(mockResponse(mockData));

      const result = await client.companyBatch({ regnos: ['1', '2'] });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/mget/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ regnos: ['1', '2'] }),
        })
      );
    });

    it('should throw if regnos exceeds 500', async () => {
      const regnos = Array.from({ length: 501 }, (_, i) => String(i));
      await expect(client.companyBatch({ regnos })).rejects.toThrow(/500/);
    });
  });

  describe('suggest', () => {
    it('should call GET /suggest/ with name param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.suggest({ name: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/suggest/?name=Test',
        expect.any(Object)
      );
    });

    it('should support email param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.suggest({ email: 'test@example.com' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/suggest/?email=test%40example.com',
        expect.any(Object)
      );
    });

    it('should support bank_account param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.suggest({ bank_account: '123456/0100' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/suggest/?bank_account=123456%2F0100',
        expect.any(Object)
      );
    });

    it('should support only_active param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.suggest({ name: 'Test', only_active: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/suggest/?name=Test&only_active=true',
        expect.any(Object)
      );
    });
  });

  describe('searchCompanies', () => {
    it('should call POST /search/cz/ for Czech companies', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.searchCompanies({ country: 'cz', filters: { name: 'Test' } });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/search/cz/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
    });

    it('should call POST /search/sk/ for Slovak companies', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.searchCompanies({ country: 'sk', filters: { name: 'Test' } });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/search/sk/',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should pass page and page_size params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.searchCompanies({
        country: 'cz',
        filters: {},
        page: 2,
        page_size: 50,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/search/cz/?page=2&page_size=50',
        expect.any(Object)
      );
    });
  });

  describe('financialStatements', () => {
    it('should call GET /company/financial-statements/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.financialStatements({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/financial-statements/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('financialIndicators', () => {
    it('should call GET /company/financial-indicators/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.financialIndicators({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/financial-indicators/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('companyEmployees', () => {
    it('should call GET /company/employees/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyEmployees({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/employees/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('companyFleet', () => {
    it('should call GET /company/fleet/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyFleet({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/fleet/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('companyFleetStats', () => {
    it('should call GET /company/fleet-stats/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyFleetStats({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/fleet-stats/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('companyBusinessPremises', () => {
    it('should call GET /company/business-premises/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyBusinessPremises({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/business-premises/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('companyLicenses', () => {
    it('should call GET /company/licenses/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyLicenses({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/licenses/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('companyEvents', () => {
    it('should call GET /company/events/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyEvents({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/events/?regno=12345678',
        expect.any(Object)
      );
    });

    it('should support from_date and to_date params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyEvents({
        regno: '12345678',
        from_date: '2024-01-01',
        to_date: '2024-12-31',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/events/?regno=12345678&from_date=2024-01-01&to_date=2024-12-31',
        expect.any(Object)
      );
    });
  });

  describe('newCompanies', () => {
    it('should call GET /company/new2/ with date params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.newCompanies({ from_date: '2024-01-01', to_date: '2024-01-31' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/new2/?from_date=2024-01-01&to_date=2024-01-31',
        expect.any(Object)
      );
    });

    it('should support country_code param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.newCompanies({
        from_date: '2024-01-01',
        to_date: '2024-01-31',
        country_code: 'sk',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('country_code=sk'),
        expect.any(Object)
      );
    });

    it('should support page and page_size', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.newCompanies({
        from_date: '2024-01-01',
        to_date: '2024-01-31',
        page: 2,
        page_size: 50,
      });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object));
    });
  });

  describe('updatedCompanies', () => {
    it('should call GET /company/updates2/ with date params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.updatedCompanies({ from_date: '2024-01-01', to_date: '2024-01-31' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/updates2/?from_date=2024-01-01&to_date=2024-01-31',
        expect.any(Object)
      );
    });
  });

  describe('companyJobAds', () => {
    it('should call GET /company/job-ads/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyJobAds({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/job-ads/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('companyGovContracts', () => {
    it('should call GET /company/gov-contracts/ with regno', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyGovContracts({ regno: '12345678' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/company/gov-contracts/?regno=12345678',
        expect.any(Object)
      );
    });
  });

  describe('relationsCompany', () => {
    it('should call GET /relations/company/ with company_id', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.relationsCompany({ company_id: '42' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/relations/company/?company_id=42',
        expect.any(Object)
      );
    });

    it('should support relation_type param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.relationsCompany({ company_id: '42', relation_type: 'owner' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/relations/company/?company_id=42&relation_type=owner',
        expect.any(Object)
      );
    });
  });

  describe('relationsPerson', () => {
    it('should call GET /relations/person/ with person_id', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.relationsPerson({ person_id: '99' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/relations/person/?person_id=99',
        expect.any(Object)
      );
    });
  });

  describe('relationsSearchPerson', () => {
    it('should call GET /relations/search/person/ with name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.relationsSearchPerson({ name: 'Jan Novák' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/relations/search/person/?name=Jan'),
        expect.any(Object)
      );
    });

    it('should support birth_date param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.relationsSearchPerson({ name: 'Jan', birth_date: '1990-01-01' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('birth_date=1990-01-01'),
        expect.any(Object)
      );
    });
  });

  describe('relationsShortestPath', () => {
    it('should call GET /relations/shortest-path/ with all params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ path: [] }));
      await client.relationsShortestPath({
        node1_id: '1',
        node1_label: 'company',
        node2_id: '2',
        node2_label: 'person',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/relations/shortest-path/'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('node1_id=1'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('node2_label=person'),
        expect.any(Object)
      );
    });

    it('should support relation_type param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ path: [] }));
      await client.relationsShortestPath({
        node1_id: '1',
        node1_label: 'company',
        node2_id: '2',
        node2_label: 'person',
        relation_type: 'owner',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('relation_type=owner'),
        expect.any(Object)
      );
    });
  });

  describe('enums', () => {
    it('should call GET /enums/ without id', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.enums({});
      expect(mockFetch).toHaveBeenCalledWith('https://api.merk.cz/enums/', expect.any(Object));
    });

    it('should call GET /enums/{id}/ with id', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'legal_form', values: [] }));
      await client.enums({ enum_id: 'legal_form' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/enums/legal_form/',
        expect.any(Object)
      );
    });
  });

  describe('subscriptionInfo', () => {
    it('should call GET /subscriptions/', async () => {
      mockFetch.mockResolvedValue(mockResponse({ plan: 'pro', credits: 100 }));
      const result = await client.subscriptionInfo();
      expect(result).toEqual({ plan: 'pro', credits: 100 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.merk.cz/subscriptions/',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('vokativ', () => {
    it('should call GET /vokativ/ with first_name and last_name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ vokativ: 'Jene' }));
      await client.vokativ({ first_name: 'Jan', last_name: 'Novák' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/vokativ/?first_name=Jan'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('last_name=Nov'),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should throw INVALID_API_KEY on 401', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Unauthorized' }, 401));
      try {
        await client.companyLookup({ regno: '123' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MerkApiError);
        expect((e as MerkApiError).code).toBe('INVALID_API_KEY');
        expect((e as MerkApiError).status).toBe(401);
      }
    });

    it('should throw INVALID_API_KEY on 403', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Forbidden' }, 403));
      try {
        await client.companyLookup({ regno: '123' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MerkApiError);
        expect((e as MerkApiError).code).toBe('INVALID_API_KEY');
      }
    });

    it('should throw NOT_FOUND on 404', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Not found' }, 404));
      try {
        await client.companyLookup({ regno: '123' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MerkApiError);
        expect((e as MerkApiError).code).toBe('NOT_FOUND');
      }
    });

    it('should throw RATE_LIMITED on 429', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Too many requests' }, 429));
      try {
        await client.companyLookup({ regno: '123' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MerkApiError);
        expect((e as MerkApiError).code).toBe('RATE_LIMITED');
      }
    });

    it('should throw BAD_REQUEST on 400', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Bad request' }, 400));
      try {
        await client.companyLookup({ regno: '123' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MerkApiError);
        expect((e as MerkApiError).code).toBe('BAD_REQUEST');
      }
    });

    it('should throw API_ERROR on 500', async () => {
      mockFetch.mockResolvedValue(mockResponse({ detail: 'Server error' }, 500));
      try {
        await client.companyLookup({ regno: '123' });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MerkApiError);
        expect((e as MerkApiError).code).toBe('API_ERROR');
      }
    });
  });

  describe('pagination support', () => {
    it('should pass page and page_size to companyEmployees', async () => {
      mockFetch.mockResolvedValue(mockResponse({ results: [] }));
      await client.companyEmployees({ regno: '123', page: 3, page_size: 25 });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=3'), expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page_size=25'),
        expect.any(Object)
      );
    });
  });
});
