import type { IsirSearchResponse, IsirCase } from '../types/isir.js';

const EISIR_URL = 'https://eisir.justice.cz/vir/api/v1/rizeni/vyhledatDleDluznika';

export class IsirClient {
  async checkInsolvency(ico: string): Promise<IsirCase[]> {
    const icNumber = parseInt(ico, 10);
    if (isNaN(icNumber)) return [];

    const response = await fetch(EISIR_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        paging: { page: 1, size: 20 },
        filter: { ic: icNumber },
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as IsirSearchResponse;
    return data.list ?? [];
  }
}
