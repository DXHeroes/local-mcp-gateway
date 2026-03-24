import * as cheerio from 'cheerio';

const BASE_URL = 'https://or.justice.cz/ias/ui';

const subjektIdCache = new Map<string, number>();

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; byzdata-mcp/1.0.0; Czech business registry scraper)',
      Accept: 'text/html',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

export interface JusticeCompanyExtract {
  name: string | null;
  courtFile: string | null;
  dateEstablished: string | null;
  address: string | null;
  ico: string | null;
  legalForm: string | null;
  businessActivities: string[];
  statutoryBody: {
    type: string;
    members: {
      role: string | null;
      name: string;
      dateOfBirth: string | null;
      address: string | null;
      functionSince: string | null;
    }[];
  } | null;
  memberCount: string | null;
  representation: string | null;
  shareholders: {
    name: string;
    dateOfBirth: string | null;
    address: string | null;
    share: {
      contribution: string | null;
      paidUp: string | null;
      businessShare: string | null;
    } | null;
  }[];
  shareCapital: string | null;
  otherFacts: string[];
}

export interface JusticePersonResult {
  name: string;
  ico: string;
  role: string | null;
  courtFile: string | null;
}

export interface JusticeDocument {
  code: string;
  type: string;
  dateCreated: string | null;
  dateReceived: string | null;
  dateRegistered: string | null;
  pages: string | null;
  detailUrl: string | null;
}

export class JusticeScraper {
  async findSubjektId(ico: string): Promise<number | null> {
    const cached = subjektIdCache.get(ico);
    if (cached !== undefined) return cached;

    const url = `${BASE_URL}/rejstrik-$firma?ico=${ico}`;
    const html = await fetchHtml(url);

    const match = html.match(/subjektId=(\d+)/);
    if (!match?.[1]) return null;

    const id = parseInt(match[1], 10);
    subjektIdCache.set(ico, id);
    return id;
  }

  async getCompanyExtract(ico: string): Promise<JusticeCompanyExtract | null> {
    const subjektId = await this.findSubjektId(ico);
    if (!subjektId) return null;

    const url = `${BASE_URL}/rejstrik-firma.vysledky?subjektId=${subjektId}&typ=PLATNY`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const result: JusticeCompanyExtract = {
      name: null,
      courtFile: null,
      dateEstablished: null,
      address: null,
      ico: null,
      legalForm: null,
      businessActivities: [],
      statutoryBody: null,
      memberCount: null,
      representation: null,
      shareholders: [],
      shareCapital: null,
      otherFacts: [],
    };

    $('div.aunp-udajPanel').each((_, panel) => {
      const $panel = $(panel);
      const label = $panel
        .find('div.div-cell.w45mm .vr-hlavicka span.nounderline')
        .text()
        .trim();
      const labelDirect = $panel
        .find('div.div-cell.w45mm .vr-hlavicka')
        .text()
        .trim();
      const sectionLabel = (label || labelDirect).replace(/:?\s*$/, '').trim();

      const valueEl = $panel.find('#udajVypis, div.div-cell:not(.w45mm)').last();
      const value = valueEl.text().trim();

      switch (true) {
        case /Datum vzniku/.test(sectionLabel):
          result.dateEstablished = value || null;
          break;
        case /Spisová značka/.test(sectionLabel):
          result.courtFile = value || null;
          break;
        case /Obchodní firma/.test(sectionLabel):
          result.name = $panel.find('span.preformatted').text().trim() || value || null;
          break;
        case /Sídlo/.test(sectionLabel):
          result.address = value || null;
          break;
        case /Identifikační číslo/.test(sectionLabel):
          result.ico = value.replace(/\s+/g, '') || null;
          break;
        case /Právní forma/.test(sectionLabel):
          result.legalForm = value || null;
          break;
        case /Základní kapitál/.test(sectionLabel):
          result.shareCapital = value || null;
          break;
        case /Počet členů/.test(sectionLabel):
          result.memberCount = value || null;
          break;
        case /Způsob jednání/.test(sectionLabel):
          result.representation = value || null;
          break;
      }
    });

    const businessSection = $('div.aunp-udajPanel')
      .filter((_, el) => $(el).find('.vr-hlavicka').text().includes('Předmět podnikání'))
      .first();
    if (businessSection.length) {
      businessSection
        .parent()
        .find('span.preformatted')
        .each((_, el) => {
          const text = $(el).text().trim();
          if (text) result.businessActivities.push(text);
        });
    }

    const statSection = $('div.aunp-udajPanel')
      .filter((_, el) => $(el).find('.vr-hlavicka').text().includes('Statutární orgán'))
      .first();
    if (statSection.length) {
      result.statutoryBody = this.parseStatutoryBody($, statSection);
    }

    const shareholderSection = $('div.aunp-udajPanel')
      .filter((_, el) => $(el).find('.vr-hlavicka').text().includes('Společníci'))
      .first();
    if (shareholderSection.length) {
      result.shareholders = this.parseShareholders($, shareholderSection);
    }

    const otherSection = $('div.aunp-udajPanel')
      .filter((_, el) => $(el).find('.vr-hlavicka').text().includes('Ostatní skutečnosti'))
      .first();
    if (otherSection.length) {
      otherSection
        .parent()
        .find('span.preformatted')
        .each((_, el) => {
          const text = $(el).text().trim();
          if (text) result.otherFacts.push(text);
        });
    }

    return result;
  }

  async getDocumentList(ico: string): Promise<JusticeDocument[] | null> {
    const subjektId = await this.findSubjektId(ico);
    if (!subjektId) return null;

    const url = `${BASE_URL}/vypis-sl-firma?subjektId=${subjektId}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const documents: JusticeDocument[] = [];

    $('table.list tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      if (cells.length < 5) return;

      const codeLink = cells.eq(0).find('a');
      const code = codeLink.text().trim().replace(/\s+/g, ' ');
      const href = codeLink.attr('href');

      const typeText = cells.eq(1).text().trim();
      const dateCreated = cells.eq(2).text().trim() || null;
      const dateReceived = cells.eq(3).text().trim() || null;
      const dateRegistered = cells.eq(4).text().trim() || null;
      const pages = cells.eq(5).text().trim() || null;

      documents.push({
        code,
        type: typeText,
        dateCreated,
        dateReceived,
        dateRegistered,
        pages,
        detailUrl: href
          ? `https://or.justice.cz/ias/ui/${href.replace(/^\.\//, '')}`
          : null,
      });
    });

    return documents;
  }

  async searchByPerson(name: string): Promise<JusticePersonResult[]> {
    const encodedName = encodeURIComponent(name);
    const url =
      `${BASE_URL}/rejstrik-$ospisovaZnacka?nazev=${encodedName}&jenPlatne=PLATNY&polozek=50`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const results: JusticePersonResult[] = [];

    $(
      'table.result-details tr, div.search-results li, ol.result-details li',
    ).each((_, row) => {
      const $row = $(row);
      const link = $row.find("a[href*='subjektId']");
      if (!link.length) return;

      const companyName = link.text().trim();
      const rowText = $row.text();
      const icoMatch = rowText.match(/IČO?:\s*(\d+)/i) ?? rowText.match(/(\d{8})/);
      const ico = icoMatch ? icoMatch[1] : null;
      if (!ico) return;

      const courtFileMatch = rowText.match(/([A-Z])\s+(\d+)\s*(?:vedená?\s+u\s+)?/);
      const courtFile = courtFileMatch
        ? `${courtFileMatch[1]} ${courtFileMatch[2]}`
        : null;

      if (results.some((r) => r.ico === ico)) return;

      results.push({
        name: companyName || 'N/A',
        ico,
        role: null,
        courtFile,
      });
    });

    if (results.length === 0) {
      $("a[href*='subjektId']").each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        if (!text || text.length < 3) return;

        const parent = $el.parent();
        const parentText = parent.text();
        const icoMatch = parentText.match(/(\d{8})/);
        if (!icoMatch?.[1]) return;
        if (results.some((r) => r.ico === icoMatch[1])) return;

        results.push({
          name: text,
          ico: icoMatch[1],
          role: null,
          courtFile: null,
        });
      });
    }

    return results;
  }

  private parseStatutoryBody(
    $: cheerio.CheerioAPI,
    section: ReturnType<cheerio.CheerioAPI>,
  ) {
    const parent = section.parent();
    const members: JusticeCompanyExtract['statutoryBody'] = {
      type: 'Statutární orgán',
      members: [],
    };

    const skipLabels = /Počet členů|Způsob jednání|Statutární orgán/;

    parent.find('div.vr-child div.aunp-udajPanel').each((_, memberPanel) => {
      const $mp = $(memberPanel);
      const roleHeader = $mp
        .find('.vr-hlavicka span.nounderline')
        .text()
        .trim()
        .replace(/:?\s*$/, '');

      if (skipLabels.test(roleHeader)) return;

      const personDiv = $mp.find('div.div-cell:not(.w45mm)').last();
      const fullText = personDiv.text().trim();

      if (!fullText || !roleHeader) return;
      if (!fullText.includes('dat. nar.') && !fullText.includes('Den vzniku funkce')) return;

      const nameSpan = personDiv.find('span span').first().text().trim();
      const name: string = nameSpan || fullText.split(',')[0]?.trim() || 'N/A';

      const dobMatch = fullText.match(/dat\.\s*nar\.\s*(\d+\.\s*\w+\s*\d+)/);
      const dateOfBirth = dobMatch?.[1]?.trim() ?? null;

      const sincMatch = fullText.match(/Den vzniku funkce:\s*(\d+\.\s*\w+\s*\d+)/);
      const functionSince = sincMatch?.[1]?.trim() ?? null;

      const lines = fullText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let address: string | null = null;
      for (const line of lines) {
        if (
          line.includes('dat. nar.') ||
          line.includes('Den vzniku') ||
          line.includes('Den zániku') ||
          line === name
        )
          continue;
        if (/\d/.test(line) && line.includes(',')) {
          address = line;
          break;
        }
      }

      members.members.push({
        role: roleHeader || null,
        name,
        dateOfBirth,
        address,
        functionSince,
      });
    });

    return members.members.length > 0 ? members : null;
  }

  private parseShareholders(
    $: cheerio.CheerioAPI,
    section: ReturnType<cheerio.CheerioAPI>,
  ) {
    const shareholders: JusticeCompanyExtract['shareholders'] = [];
    const parent = section.parent();

    parent.find('> div.vr-child').each((_, child) => {
      const $child = $(child);
      const text = $child.text().trim();
      if (!text) return;

      const labelText = $child.find('.vr-hlavicka span.nounderline').first().text().trim();
      const isShareholderEntry =
        /Společník|Společnice|Akcionář/i.test(labelText) ||
        (text.includes('dat. nar.') && !labelText.match(/^Podíl/));

      if (/^Podíl/i.test(labelText) && !text.includes('dat. nar.')) return;
      if (!isShareholderEntry && !text.includes('IČ:') && !text.includes('IČO:')) return;

      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      let name = 'N/A';
      for (const line of lines) {
        if (/^(Společník|Podíl|Vklad|Splaceno|Obchodní podíl|Den)/i.test(line)) continue;
        if (/^dat\.\s*nar/.test(line)) continue;
        name = line.replace(/,\s*dat\.\s*nar\..*/, '').replace(/,\s*IČ:.*/, '').trim();
        if (name) break;
      }

      const dobMatch = text.match(/dat\.\s*nar\.\s*(\d+\.\s*\w+\s*\d+)/);
      const dateOfBirth = dobMatch?.[1]?.trim() ?? null;

      let address: string | null = null;
      let pastName = false;
      for (const line of lines) {
        if (line.includes(name)) {
          pastName = true;
          continue;
        }
        if (!pastName) continue;
        if (/Vklad:|Splaceno:|Obchodní podíl:|Podíl:/.test(line)) break;
        if (/dat\.\s*nar/.test(line)) continue;
        if (/\d/.test(line) && line.includes(',') && line.length > 10) {
          address = line;
          break;
        }
      }

      const vkladMatch = text.match(/Vklad:\s*([^\n]+)/);
      const splacenoMatch = text.match(/Splaceno:\s*([^\n]+)/);
      const podilMatch = text.match(/Obchodní podíl:\s*([^\n]+)/);

      if (shareholders.some((s) => s.name === name)) return;

      shareholders.push({
        name,
        dateOfBirth,
        address,
        share:
          vkladMatch || splacenoMatch || podilMatch
            ? {
                contribution: vkladMatch?.[1]?.trim() ?? null,
                paidUp: splacenoMatch?.[1]?.trim() ?? null,
                businessShare: podilMatch?.[1]?.trim() ?? null,
              }
            : null,
      });
    });

    return shareholders;
  }
}
