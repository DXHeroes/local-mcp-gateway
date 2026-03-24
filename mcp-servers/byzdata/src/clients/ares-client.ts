import type {
  AresSubject,
  AresSearchResponse,
  AresVrResponse,
  AresRzpResponse,
} from '../types/ares.js';
import { fetchJson, HttpError } from '../utils/http.js';
import { padIco } from '../utils/formatters.js';

const BASE_URL = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest';

export class AresClient {
  async searchSubjects(query: string, limit: number = 10): Promise<AresSearchResponse> {
    const url = `${BASE_URL}/ekonomicke-subjekty/vyhledat`;
    const result = await fetchJson<AresSearchResponse>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        obchodniJmeno: query,
        pocet: Math.min(limit, 100),
        start: 0,
      }),
    });
    return result ?? { pocetCelkem: 0, ekonomickeSubjekty: [] };
  }

  async getSubject(ico: string): Promise<AresSubject | null> {
    const url = `${BASE_URL}/ekonomicke-subjekty/${padIco(ico)}`;
    return fetchJson<AresSubject>(url);
  }

  async getVrDetail(ico: string): Promise<AresVrResponse | null> {
    const url = `${BASE_URL}/ekonomicke-subjekty-vr/${padIco(ico)}`;
    try {
      return await fetchJson<AresVrResponse>(url);
    } catch (e) {
      if (e instanceof HttpError && e.status === 400) {
        return null;
      }
      throw e;
    }
  }

  async getRzpDetail(ico: string): Promise<AresRzpResponse | null> {
    const url = `${BASE_URL}/ekonomicke-subjekty-rzp/${padIco(ico)}`;
    try {
      return await fetchJson<AresRzpResponse>(url);
    } catch (e) {
      if (e instanceof HttpError && e.status === 400) {
        return null;
      }
      throw e;
    }
  }
}
