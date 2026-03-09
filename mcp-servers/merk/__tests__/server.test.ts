/**
 * Unit tests for MerkMcpServer
 */

import type { ApiKeyConfig } from '@dxheroes/local-mcp-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MerkMcpServer } from '../src/server.js';

// Mock the MerkClient
const mockValidateApiKey = vi.fn();
const mockCompanyLookup = vi.fn();
const mockCompanyBatch = vi.fn();
const mockSuggest = vi.fn();
const mockSearchCompanies = vi.fn();
const mockFinancialStatements = vi.fn();
const mockFinancialIndicators = vi.fn();
const mockCompanyEmployees = vi.fn();
const mockCompanyFleet = vi.fn();
const mockCompanyFleetStats = vi.fn();
const mockCompanyBusinessPremises = vi.fn();
const mockCompanyLicenses = vi.fn();
const mockCompanyEvents = vi.fn();
const mockNewCompanies = vi.fn();
const mockUpdatedCompanies = vi.fn();
const mockCompanyJobAds = vi.fn();
const mockCompanyGovContracts = vi.fn();
const mockRelationsCompany = vi.fn();
const mockRelationsPerson = vi.fn();
const mockRelationsSearchPerson = vi.fn();
const mockRelationsShortestPath = vi.fn();
const mockEnums = vi.fn();
const mockSubscriptionInfo = vi.fn();
const mockVokativ = vi.fn();

vi.mock('../src/client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/client.js')>();
  return {
    ...original,
    MerkClient: class MockMerkClient {
      validateApiKey = mockValidateApiKey;
      companyLookup = mockCompanyLookup;
      companyBatch = mockCompanyBatch;
      suggest = mockSuggest;
      searchCompanies = mockSearchCompanies;
      financialStatements = mockFinancialStatements;
      financialIndicators = mockFinancialIndicators;
      companyEmployees = mockCompanyEmployees;
      companyFleet = mockCompanyFleet;
      companyFleetStats = mockCompanyFleetStats;
      companyBusinessPremises = mockCompanyBusinessPremises;
      companyLicenses = mockCompanyLicenses;
      companyEvents = mockCompanyEvents;
      newCompanies = mockNewCompanies;
      updatedCompanies = mockUpdatedCompanies;
      companyJobAds = mockCompanyJobAds;
      companyGovContracts = mockCompanyGovContracts;
      relationsCompany = mockRelationsCompany;
      relationsPerson = mockRelationsPerson;
      relationsSearchPerson = mockRelationsSearchPerson;
      relationsShortestPath = mockRelationsShortestPath;
      enums = mockEnums;
      subscriptionInfo = mockSubscriptionInfo;
      vokativ = mockVokativ;
    },
  };
});

describe('MerkMcpServer', () => {
  const apiKeyConfig: ApiKeyConfig = {
    apiKey: 'test-merk-key',
    headerName: 'Authorization',
    headerValue: 'Token test-merk-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with valid API key', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();

      // Should be able to call tools
      mockCompanyLookup.mockResolvedValue({ regno: '123' });
      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as { isError?: boolean };
      expect(result.isError).toBeUndefined();
    });

    it('should set error when no API key is provided', async () => {
      const server = new MerkMcpServer(null);
      await server.initialize();

      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as {
        isError: boolean;
        content: Array<{ text: string }>;
      };
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_KEY_REQUIRED');
    });

    it('should set error when API key is empty', async () => {
      const server = new MerkMcpServer({ ...apiKeyConfig, apiKey: '' });
      await server.initialize();

      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as { isError: boolean };
      expect(result.isError).toBe(true);
    });
  });

  describe('validate', () => {
    it('should delegate to MerkClient.validateApiKey', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();

      mockValidateApiKey.mockResolvedValue({ valid: true });
      const result = await server.validate();
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid when no API key configured', async () => {
      const server = new MerkMcpServer(null);
      await server.initialize();

      const result = await server.validate();
      expect(result).toEqual({ valid: false, error: 'API key not configured' });
    });
  });

  describe('listTools', () => {
    it('should return 23 tools', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      expect(tools).toHaveLength(23);
    });

    it('should have correct tool names', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      const names = tools.map((t) => t.name);

      expect(names).toContain('merk_company_lookup');
      expect(names).toContain('merk_company_batch');
      expect(names).toContain('merk_company_suggest');
      expect(names).toContain('merk_search_companies');
      expect(names).toContain('merk_financial_statements');
      expect(names).toContain('merk_financial_indicators');
      expect(names).toContain('merk_company_employees');
      expect(names).toContain('merk_company_fleet');
      expect(names).toContain('merk_company_fleet_stats');
      expect(names).toContain('merk_company_business_premises');
      expect(names).toContain('merk_company_licenses');
      expect(names).toContain('merk_company_events');
      expect(names).toContain('merk_new_companies');
      expect(names).toContain('merk_updated_companies');
      expect(names).toContain('merk_company_job_ads');
      expect(names).toContain('merk_company_gov_contracts');
      expect(names).toContain('merk_relations_company');
      expect(names).toContain('merk_relations_person');
      expect(names).toContain('merk_relations_search_person');
      expect(names).toContain('merk_relations_shortest_path');
      expect(names).toContain('merk_enums');
      expect(names).toContain('merk_subscription_info');
      expect(names).toContain('merk_vokativ');
    });

    it('should have inputSchema on each tool', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
      }
    });

    it('should have description on each tool', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();

      const tools = await server.listTools();
      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
      }
    });
  });

  describe('callTool - merk_company_lookup', () => {
    let server: MerkMcpServer;

    beforeEach(async () => {
      server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return company data on success', async () => {
      mockCompanyLookup.mockResolvedValue({ regno: '12345678', name: 'Test Corp' });

      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      expect(data.regno).toBe('12345678');
    });

    it('should return error for invalid input (missing required params)', async () => {
      const result = (await server.callTool('merk_company_lookup', {})) as {
        isError: boolean;
        content: Array<{ text: string }>;
      };
      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('INVALID_INPUT');
    });
  });

  describe('callTool - merk_company_batch', () => {
    let server: MerkMcpServer;

    beforeEach(async () => {
      server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return batch results', async () => {
      mockCompanyBatch.mockResolvedValue({ results: [{ regno: '1' }] });

      const result = (await server.callTool('merk_company_batch', {
        regnos: ['12345678'],
      })) as { content: Array<{ text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.results).toHaveLength(1);
    });
  });

  describe('callTool - merk_search_companies', () => {
    let server: MerkMcpServer;

    beforeEach(async () => {
      server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should search with country and filters', async () => {
      mockSearchCompanies.mockResolvedValue({ results: [] });

      await server.callTool('merk_search_companies', {
        country: 'cz',
        filters: { name: 'Test' },
      });

      expect(mockSearchCompanies).toHaveBeenCalledWith({
        country: 'cz',
        filters: { name: 'Test' },
      });
    });
  });

  describe('callTool - merk_relations_shortest_path', () => {
    let server: MerkMcpServer;

    beforeEach(async () => {
      server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should find shortest path', async () => {
      mockRelationsShortestPath.mockResolvedValue({ path: [{ id: '1' }, { id: '2' }] });

      const result = (await server.callTool('merk_relations_shortest_path', {
        node1_id: '1',
        node1_label: 'company',
        node2_id: '2',
        node2_label: 'person',
      })) as { content: Array<{ text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.path).toHaveLength(2);
    });
  });

  describe('callTool - merk_enums', () => {
    let server: MerkMcpServer;

    beforeEach(async () => {
      server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return all enums when no id', async () => {
      mockEnums.mockResolvedValue([{ id: 'legal_form' }]);
      const result = (await server.callTool('merk_enums', {})) as {
        content: Array<{ text: string }>;
      };
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveLength(1);
    });
  });

  describe('callTool - merk_vokativ', () => {
    let server: MerkMcpServer;

    beforeEach(async () => {
      server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should return vocative form', async () => {
      mockVokativ.mockResolvedValue({ vokativ: 'Jene' });
      const result = (await server.callTool('merk_vokativ', {
        first_name: 'Jan',
        last_name: 'Novák',
      })) as { content: Array<{ text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.vokativ).toBe('Jene');
    });
  });

  describe('callTool - unknown tool', () => {
    it('should return error for unknown tool name', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();

      const result = (await server.callTool('unknown_tool', {})) as {
        content: Array<{ text: string }>;
        isError: boolean;
      };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('UNKNOWN_TOOL');
    });
  });

  describe('callTool - API error handling', () => {
    let server: MerkMcpServer;

    beforeEach(async () => {
      server = new MerkMcpServer(apiKeyConfig);
      await server.initialize();
    });

    it('should handle MerkApiError with INVALID_API_KEY code', async () => {
      const { MerkApiError } = await import('../src/client.js');
      mockCompanyLookup.mockRejectedValue(new MerkApiError('Unauthorized', 401, 'INVALID_API_KEY'));

      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('INVALID_API_KEY');
    });

    it('should handle MerkApiError with RATE_LIMITED code', async () => {
      const { MerkApiError } = await import('../src/client.js');
      mockCompanyLookup.mockRejectedValue(new MerkApiError('Too many', 429, 'RATE_LIMITED'));

      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('RATE_LIMITED');
    });

    it('should handle MerkApiError with NOT_FOUND code', async () => {
      const { MerkApiError } = await import('../src/client.js');
      mockCompanyLookup.mockRejectedValue(new MerkApiError('Not found', 404, 'NOT_FOUND'));

      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('NOT_FOUND');
    });

    it('should handle generic errors', async () => {
      mockCompanyLookup.mockRejectedValue(new Error('Network error'));

      const result = (await server.callTool('merk_company_lookup', {
        regno: '12345678',
      })) as { content: Array<{ text: string }>; isError: boolean };

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe('API_ERROR');
    });
  });

  describe('listResources', () => {
    it('should return empty array', async () => {
      const server = new MerkMcpServer(apiKeyConfig);
      const resources = await server.listResources();
      expect(resources).toEqual([]);
    });
  });
});
