/**
 * ByzData MCP Server
 *
 * Czech business registry data from ARES, Justice.cz, and ISIR.
 */

import type { McpResource, McpTool } from '@dxheroes/local-mcp-core';
import { McpServer } from '@dxheroes/local-mcp-core';
import { z } from 'zod';
import { CompanyService } from './services/company-service.js';
import { JusticeScraper } from './clients/justice-scraper.js';
import { IsirClient } from './clients/isir-client.js';

const IcoSchema = z
  .string()
  .regex(/^\d{1,8}$/, 'IČO must be 1-8 digits')
  .describe('Company IČO (identification number)');

const SearchInputSchema = z.object({
  query: z.string().describe('Company name or partial name to search'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe('Max results to return (1-100, default 10)'),
});

const IcoInputSchema = z.object({
  ico: IcoSchema,
});

export class ByzdataMcpServer extends McpServer {
  private service!: CompanyService;
  private scraper!: JusticeScraper;
  private isir!: IsirClient;

  async initialize(): Promise<void> {
    this.service = new CompanyService();
    this.scraper = new JusticeScraper();
    this.isir = new IsirClient();
  }

  async listTools(): Promise<McpTool[]> {
    return [
      {
        name: 'search_company',
        description:
          'Search Czech companies by name. Returns a list of matching companies with basic info.',
        inputSchema: SearchInputSchema,
      },
      {
        name: 'get_company',
        description:
          'Get full company overview by IČO (Czech company registration number). ' +
          'Returns name, address, legal form, establishment date, VAT number, court file, ' +
          'NACE codes, share capital.',
        inputSchema: IcoInputSchema,
      },
      {
        name: 'get_company_details',
        description:
          'Get company business activities, trade licenses, and NACE industry codes by IČO.',
        inputSchema: IcoInputSchema,
      },
      {
        name: 'get_company_relations',
        description:
          'Get company statutory bodies (directors, board members), shareholders, ' +
          'and their roles by IČO.',
        inputSchema: IcoInputSchema,
      },
      {
        name: 'get_company_documents',
        description:
          'Get list of company documents from the Czech commercial register collection ' +
          '(sbírka listin). Includes financial statements, founding documents, notarial records.',
        inputSchema: IcoInputSchema,
      },
      {
        name: 'get_company_extract',
        description:
          'Get full company extract from the Czech commercial register (obchodní rejstřík). ' +
          'Includes detailed info about statutory bodies, shareholders with shares, business ' +
          'activities, representation method, and other facts as registered at the court.',
        inputSchema: IcoInputSchema,
      },
      {
        name: 'check_insolvency',
        description:
          'Check if a Czech company is or was in insolvency proceedings. ' +
          'Queries the Czech insolvency register (ISIR/eISIR).',
        inputSchema: IcoInputSchema,
      },
      {
        name: 'check_company_health',
        description:
          'Comprehensive health check of a Czech company. Checks registration status, ' +
          'VAT status, insolvency, trade licenses, and company age. Returns a traffic-light ' +
          'assessment.',
        inputSchema: IcoInputSchema,
      },
      {
        name: 'find_related_companies',
        description:
          'Find companies related to a given company through shared people (directors, ' +
          'shareholders). Discovers the ownership/management network by finding all statutory ' +
          'body members and their other companies.',
        inputSchema: IcoInputSchema,
      },
    ];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    try {
      switch (name) {
        case 'search_company':
          return await this.handleSearchCompany(args);
        case 'get_company':
          return await this.handleGetCompany(args);
        case 'get_company_details':
          return await this.handleGetCompanyDetails(args);
        case 'get_company_relations':
          return await this.handleGetCompanyRelations(args);
        case 'get_company_documents':
          return await this.handleGetCompanyDocuments(args);
        case 'get_company_extract':
          return await this.handleGetCompanyExtract(args);
        case 'check_insolvency':
          return await this.handleCheckInsolvency(args);
        case 'check_company_health':
          return await this.handleCheckCompanyHealth(args);
        case 'find_related_companies':
          return await this.handleFindRelatedCompanies(args);
        default:
          return this.errorResponse('UNKNOWN_TOOL', `Unknown tool: ${name}`);
      }
    } catch (error) {
      return this.errorResponse(
        'TOOL_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async listResources(): Promise<McpResource[]> {
    return [
      {
        uri: 'company://{ico}/overview',
        name: 'company-overview',
        description: 'Company overview — basic info, address, legal form, share capital',
      },
      {
        uri: 'company://{ico}/relations',
        name: 'company-relations',
        description: 'Company relations — statutory bodies, shareholders',
      },
      {
        uri: 'company://{ico}/documents',
        name: 'company-documents',
        description: 'Company documents — sbírka listin',
      },
    ];
  }

  async readResource(uri: string): Promise<unknown> {
    const overviewMatch = uri.match(/^company:\/\/(\d+)\/overview$/);
    if (overviewMatch?.[1]) {
      const ico = overviewMatch[1];
      const overview = await this.service.getOverview(ico);
      if (!overview) {
        return { contents: [{ uri, text: `Company ${ico} not found.`, mimeType: 'text/plain' }] };
      }
      const text = [
        `# ${overview.name}`,
        `IČO: ${overview.ico}`,
        `DIČ: ${overview.dic ?? 'N/A'}`,
        `Právní forma: ${overview.legalForm?.name ?? 'N/A'}`,
        `Sídlo: ${overview.address.full}`,
        `Datum vzniku: ${overview.dateEstablished ?? 'N/A'}`,
        `Spisová značka: ${overview.courtFile ?? 'N/A'}`,
        overview.shareCapital
          ? `Základní kapitál: ${overview.shareCapital.amount.toLocaleString('cs-CZ')} ${overview.shareCapital.currency}`
          : '',
        `CZ-NACE: ${overview.nace.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n');
      return { contents: [{ uri, text, mimeType: 'text/markdown' }] };
    }

    const relationsMatch = uri.match(/^company:\/\/(\d+)\/relations$/);
    if (relationsMatch?.[1]) {
      const ico = relationsMatch[1];
      const relations = await this.service.getRelations(ico);
      if (!relations) {
        return { contents: [{ uri, text: `Company ${ico} not found.`, mimeType: 'text/plain' }] };
      }
      const lines: string[] = [`# ${relations.name} — Relations`];
      for (const body of relations.statutoryBodies) {
        lines.push(`\n## ${body.organName}`);
        for (const m of body.members) {
          lines.push(`- ${m.name} (${m.role ?? 'člen'}, od ${m.since ?? 'N/A'})`);
        }
      }
      if (relations.shareholders.length > 0) {
        lines.push('\n## Společníci');
        for (const s of relations.shareholders) {
          const pct = s.share?.percentage != null ? ` — ${s.share.percentage}%` : '';
          lines.push(`- ${s.name}${pct}`);
        }
      }
      return { contents: [{ uri, text: lines.join('\n'), mimeType: 'text/markdown' }] };
    }

    const documentsMatch = uri.match(/^company:\/\/(\d+)\/documents$/);
    if (documentsMatch?.[1]) {
      const ico = documentsMatch[1];
      const docs = await this.scraper.getDocumentList(ico);
      if (!docs) {
        return { contents: [{ uri, text: `Company ${ico} not found.`, mimeType: 'text/plain' }] };
      }
      const lines = [`# Sbírka listin — IČO ${ico}`, `${docs.length} documents`, ''];
      for (const doc of docs) {
        lines.push(`- ${doc.code}: ${doc.type} (${doc.dateCreated ?? 'N/A'})`);
      }
      return { contents: [{ uri, text: lines.join('\n'), mimeType: 'text/markdown' }] };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  }

  // ── Tool Handlers ──────────────────────────────────────────

  private async handleSearchCompany(args: unknown): Promise<unknown> {
    const input = SearchInputSchema.parse(args);
    const results = await this.service.search(input.query, input.limit);

    if (results.length === 0) {
      return this.textResponse(`No companies found matching "${input.query}".`);
    }

    const text = results
      .map(
        (r, i) =>
          `${i + 1}. **${r.name}** (IČO: ${r.ico})\n` +
          `   Právní forma: ${r.legalForm ?? 'N/A'}\n` +
          `   Sídlo: ${r.address ?? 'N/A'}\n` +
          `   Datum vzniku: ${r.dateEstablished ?? 'N/A'}`,
      )
      .join('\n\n');

    return this.textResponse(
      `Found ${results.length} companies matching "${input.query}":\n\n${text}`,
    );
  }

  private async handleGetCompany(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);
    const company = await this.service.getOverview(ico);

    if (!company) {
      return this.errorResponse('NOT_FOUND', `Company with IČO ${ico} not found.`);
    }

    const activeRegs = Object.entries(company.registrationStatus)
      .filter(([, v]) => v === 'AKTIVNI')
      .map(([k]) => k);

    const capitalStr = company.shareCapital
      ? `${company.shareCapital.amount.toLocaleString('cs-CZ')} ${company.shareCapital.currency}`
      : null;

    const lines: string[] = [
      `# ${company.name}`,
      '',
      '| Field | Value |',
      '|-------|-------|',
      `| IČO | ${company.ico} |`,
      `| DIČ | ${company.dic ?? 'N/A'} |`,
      `| Právní forma | ${company.legalForm ? `${company.legalForm.name} (${company.legalForm.code})` : 'N/A'} |`,
      `| Sídlo | ${company.address.full} |`,
      `| Datum vzniku | ${company.dateEstablished ?? 'N/A'} |`,
      `| Spisová značka | ${company.courtFile ?? 'N/A'} |`,
    ];

    if (capitalStr) {
      lines.push(`| Základní kapitál | ${capitalStr} |`);
      if (company.shareCapital?.paidUp) {
        lines.push(`| Splaceno | ${company.shareCapital.paidUp} |`);
      }
    }

    if (company.nace.length > 0) {
      lines.push('', '## CZ-NACE kódy', '', company.nace.join(', '));
    }

    if (activeRegs.length > 0) {
      lines.push('', '## Aktivní registrace', '', activeRegs.join(', '));
    }

    return this.textResponse(lines.join('\n'));
  }

  private async handleGetCompanyDetails(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);
    const details = await this.service.getDetails(ico);

    if (!details) {
      return this.errorResponse('NOT_FOUND', `Company with IČO ${ico} not found.`);
    }

    const lines: string[] = [`# ${details.name} — Details`, ''];

    if (details.businessActivities.length > 0) {
      lines.push('## Předmět podnikání (z obchodního rejstříku)', '');
      details.businessActivities.forEach((a) => lines.push(`- ${a}`));
      lines.push('');
    }

    if (details.tradeLicenses.length > 0) {
      lines.push('## Živnosti', '');
      lines.push('| Předmět | Druh | Od | Do |');
      lines.push('|---------|------|----|----|');
      details.tradeLicenses.forEach((l) =>
        lines.push(
          `| ${l.subject} | ${l.type ?? 'N/A'} | ${l.dateFrom ?? 'N/A'} | ${l.dateTo ?? 'trvá'} |`,
        ),
      );
      lines.push('');
    }

    if (details.naceActivities.length > 0) {
      lines.push('## CZ-NACE kódy', '', details.naceActivities.join(', '));
    }

    return this.textResponse(lines.join('\n'));
  }

  private async handleGetCompanyRelations(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);
    const relations = await this.service.getRelations(ico);

    if (!relations) {
      return this.errorResponse('NOT_FOUND', `Company with IČO ${ico} not found.`);
    }

    const lines: string[] = [`# ${relations.name} — Relations`, ''];

    if (relations.statutoryBodies.length > 0) {
      for (const body of relations.statutoryBodies) {
        lines.push(`## ${body.organName}`, '');
        if (body.representation) {
          lines.push(`**Způsob jednání:** ${body.representation}`, '');
        }
        if (body.members.length > 0) {
          lines.push('| Jméno | Funkce | Od | Do |');
          lines.push('|-------|--------|----|----|');
          for (const m of body.members) {
            lines.push(
              `| ${m.name} | ${m.role ?? 'člen'} | ${m.since ?? 'N/A'} | ${m.until ?? 'trvá'} |`,
            );
          }
          lines.push('');
        }
      }
    }

    if (relations.shareholders.length > 0) {
      lines.push('## Společníci / Akcionáři', '');
      lines.push('| Jméno | Typ | Vklad | Podíl |');
      lines.push('|-------|-----|-------|-------|');
      for (const s of relations.shareholders) {
        const shareStr = s.share
          ? `${s.share.amount?.toLocaleString('cs-CZ') ?? 'N/A'} ${s.share.currency ?? ''}`
          : 'N/A';
        const pctStr = s.share?.percentage != null ? `${s.share.percentage}%` : 'N/A';
        lines.push(
          `| ${s.name} | ${s.type === 'company' ? 'PO' : 'FO'} | ${shareStr} | ${pctStr} |`,
        );
      }
    }

    if (relations.statutoryBodies.length === 0 && relations.shareholders.length === 0) {
      lines.push(
        'No statutory bodies or shareholders found in the commercial register.',
      );
    }

    return this.textResponse(lines.join('\n'));
  }

  private async handleGetCompanyDocuments(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);
    const documents = await this.scraper.getDocumentList(ico);

    if (!documents) {
      return this.errorResponse(
        'NOT_FOUND',
        `Company with IČO ${ico} not found in the commercial register.`,
      );
    }

    if (documents.length === 0) {
      return this.textResponse(`No documents found for IČO ${ico} in the collection.`);
    }

    const lines: string[] = [
      `# Sbírka listin — IČO ${ico}`,
      '',
      `Found ${documents.length} documents.`,
      '',
      '| Číslo listiny | Typ | Vznik | Došlo na soud | Stránek |',
      '|---------------|-----|-------|---------------|---------|',
    ];

    for (const doc of documents) {
      lines.push(
        `| ${doc.code} | ${doc.type} | ${doc.dateCreated ?? '—'} | ${doc.dateReceived ?? '—'} | ${doc.pages ?? '?'} |`,
      );
    }

    return this.textResponse(lines.join('\n'));
  }

  private async handleGetCompanyExtract(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);
    const extract = await this.scraper.getCompanyExtract(ico);

    if (!extract) {
      return this.errorResponse(
        'NOT_FOUND',
        `Company with IČO ${ico} not found in the commercial register.`,
      );
    }

    const lines: string[] = [
      '# Výpis z obchodního rejstříku',
      '',
      '| Údaj | Hodnota |',
      '|------|---------|',
      `| Obchodní firma | ${extract.name ?? 'N/A'} |`,
      `| Spisová značka | ${extract.courtFile ?? 'N/A'} |`,
      `| Datum vzniku | ${extract.dateEstablished ?? 'N/A'} |`,
      `| Sídlo | ${extract.address ?? 'N/A'} |`,
      `| IČO | ${extract.ico ?? ico} |`,
      `| Právní forma | ${extract.legalForm ?? 'N/A'} |`,
      `| Základní kapitál | ${extract.shareCapital ?? 'N/A'} |`,
    ];

    if (extract.businessActivities.length > 0) {
      lines.push('', '## Předmět podnikání', '');
      for (const activity of extract.businessActivities) {
        lines.push(activity);
      }
    }

    if (extract.statutoryBody) {
      lines.push('', `## ${extract.statutoryBody.type}`, '');
      if (extract.memberCount) {
        lines.push(`Počet členů: ${extract.memberCount}`);
      }
      if (extract.representation) {
        lines.push(`Způsob jednání: ${extract.representation}`);
      }
      lines.push('');
      for (const m of extract.statutoryBody.members) {
        lines.push(`### ${m.role ?? 'Člen'}`, `- **Jméno:** ${m.name}`);
        if (m.dateOfBirth) lines.push(`- **Datum narození:** ${m.dateOfBirth}`);
        if (m.address) lines.push(`- **Adresa:** ${m.address}`);
        if (m.functionSince) lines.push(`- **Den vzniku funkce:** ${m.functionSince}`);
        lines.push('');
      }
    }

    if (extract.shareholders.length > 0) {
      lines.push('## Společníci', '');
      for (const s of extract.shareholders) {
        lines.push(`### ${s.name}`);
        if (s.dateOfBirth) lines.push(`- **Datum narození:** ${s.dateOfBirth}`);
        if (s.address) lines.push(`- **Adresa:** ${s.address}`);
        if (s.share) {
          if (s.share.contribution) lines.push(`- **Vklad:** ${s.share.contribution}`);
          if (s.share.paidUp) lines.push(`- **Splaceno:** ${s.share.paidUp}`);
          if (s.share.businessShare) {
            lines.push(`- **Obchodní podíl:** ${s.share.businessShare}`);
          }
        }
        lines.push('');
      }
    }

    if (extract.otherFacts.length > 0) {
      lines.push('## Ostatní skutečnosti', '');
      for (const fact of extract.otherFacts) {
        lines.push(`- ${fact}`);
      }
    }

    return this.textResponse(lines.join('\n'));
  }

  private async handleCheckInsolvency(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);
    const cases = await this.isir.checkInsolvency(ico);

    if (cases.length === 0) {
      return this.textResponse(
        `**IČO ${ico} — Insolvence: NE**\n\n` +
          'Žádné insolvenční řízení nebylo nalezeno v registru ISIR.',
      );
    }

    const lines: string[] = [
      `**IČO ${ico} — Insolvence: ANO** (${cases.length} řízení)`,
      '',
      '| Spisová značka | Soud | Stav | Zahájeno | Ukončeno |',
      '|----------------|------|------|----------|----------|',
    ];

    for (const c of cases) {
      lines.push(
        `| ${c.spisovaZnacka ?? 'N/A'} | ${c.soud ?? 'N/A'} | ${c.druhStavRizeni ?? 'N/A'} | ${c.datumZalozeni ?? 'N/A'} | ${c.datumUkonceni ?? '—'} |`,
      );
    }

    return this.textResponse(lines.join('\n'));
  }

  private async handleCheckCompanyHealth(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);

    const [overview, details, insolvencyCases] = await Promise.all([
      this.service.getOverview(ico),
      this.service.getDetails(ico),
      this.isir.checkInsolvency(ico),
    ]);

    if (!overview) {
      return this.errorResponse('NOT_FOUND', `Company with IČO ${ico} not found.`);
    }

    const checks: { label: string; status: string; detail: string }[] = [];

    const vrStatus = overview.registrationStatus['Obchodní rejstřík'];
    checks.push({
      label: 'Obchodní rejstřík',
      status: vrStatus === 'AKTIVNI' ? '🟢' : '🔴',
      detail: vrStatus ?? 'N/A',
    });

    const dphStatus = overview.registrationStatus['DPH (VAT)'];
    checks.push({
      label: 'Plátce DPH',
      status: dphStatus === 'AKTIVNI' ? '🟢' : '🟡',
      detail: dphStatus ?? 'Neregistrován',
    });

    const activeInsolvency = insolvencyCases.filter((c) => !c.datumUkonceni);
    checks.push({
      label: 'Insolvence',
      status:
        activeInsolvency.length > 0
          ? '🔴'
          : insolvencyCases.length > 0
            ? '🟡'
            : '🟢',
      detail:
        activeInsolvency.length > 0
          ? `AKTIVNÍ (${activeInsolvency.length} řízení)`
          : insolvencyCases.length > 0
            ? `Historická (${insolvencyCases.length} ukončených)`
            : 'Bez insolvence',
    });

    const rzpStatus = overview.registrationStatus['Živnostenský rejstřík'];
    checks.push({
      label: 'Živnosti',
      status: rzpStatus === 'AKTIVNI' ? '🟢' : '🟡',
      detail:
        rzpStatus === 'AKTIVNI'
          ? `Aktivní (${details?.tradeLicenses.length ?? 0} živností)`
          : rzpStatus ?? 'N/A',
    });

    const age = overview.dateEstablished
      ? Math.floor(
          (Date.now() - new Date(overview.dateEstablished).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : null;
    checks.push({
      label: 'Stáří firmy',
      status:
        age !== null && age >= 3 ? '🟢' : age !== null && age >= 1 ? '🟡' : '🔴',
      detail:
        age !== null ? `${age} let (od ${overview.dateEstablished})` : 'N/A',
    });

    const redCount = checks.filter((c) => c.status === '🔴').length;
    const yellowCount = checks.filter((c) => c.status === '🟡').length;
    const overallStatus =
      redCount > 0 ? '🔴 RIZIKO' : yellowCount > 1 ? '🟡 POZOR' : '🟢 OK';

    const lines: string[] = [
      `# ${overview.name} — Health Check`,
      '',
      `**Celkové hodnocení: ${overallStatus}**`,
      '',
      '| Kontrola | Stav | Detail |',
      '|----------|------|--------|',
      ...checks.map((c) => `| ${c.label} | ${c.status} | ${c.detail} |`),
      '',
      '## Souhrn',
      '',
      `Firma ${overview.name} (IČO ${overview.ico}) vykazuje celkový status: ${overallStatus}.`,
    ];

    return this.textResponse(lines.join('\n'));
  }

  private async handleFindRelatedCompanies(args: unknown): Promise<unknown> {
    const { ico } = IcoInputSchema.parse(args);
    const relations = await this.service.getRelations(ico);

    if (!relations) {
      return this.errorResponse('NOT_FOUND', `Company with IČO ${ico} not found.`);
    }

    const people = new Set<string>();
    for (const body of relations.statutoryBodies) {
      for (const member of body.members) {
        if (member.name && member.name !== 'N/A' && !member.until) {
          people.add(member.name);
        }
      }
    }

    for (const sh of relations.shareholders) {
      if (sh.type === 'person' && sh.name !== 'N/A') {
        people.add(sh.name);
      }
    }

    if (people.size === 0) {
      return this.textResponse(
        `No people found in statutory bodies of ${relations.name}.`,
      );
    }

    const relatedMap = new Map<string, { companies: { name: string; ico: string }[] }>();

    for (const personName of people) {
      try {
        const results = await this.scraper.searchByPerson(personName);
        const otherCompanies = results.filter((r) => r.ico !== ico);
        if (otherCompanies.length > 0) {
          relatedMap.set(personName, {
            companies: otherCompanies.map((r) => ({ name: r.name, ico: r.ico })),
          });
        }
      } catch {
        // Skip on error for individual person search
      }
    }

    const lines: string[] = [
      `# Propojené firmy — ${relations.name} (IČO ${ico})`,
      '',
      `Nalezeno ${people.size} osob ve statutárních orgánech.`,
      '',
    ];

    if (relatedMap.size === 0) {
      lines.push('Žádné další firmy propojené přes statutární orgány nebyly nalezeny.');
    } else {
      for (const [person, data] of relatedMap) {
        lines.push(`## ${person}`, '');
        for (const c of data.companies) {
          lines.push(`- **${c.name}** (IČO: ${c.ico})`);
        }
        lines.push('');
      }
    }

    return this.textResponse(lines.join('\n'));
  }

  // ── Helpers ────────────────────────────────────────────────

  private textResponse(text: string): unknown {
    return { content: [{ type: 'text', text }] };
  }

  private errorResponse(code: string, message: string): unknown {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: code, message }) }],
      isError: true,
    };
  }
}
