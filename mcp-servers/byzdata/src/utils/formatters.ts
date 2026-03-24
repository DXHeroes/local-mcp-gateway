import type { AresSidlo } from '../types/ares.js';

export function formatAddress(sidlo?: AresSidlo): string {
  if (!sidlo) return 'N/A';

  if (sidlo.textovaAdresa) return sidlo.textovaAdresa;

  const parts: string[] = [];

  if (sidlo.nazevUlice) {
    let street = sidlo.nazevUlice;
    if (sidlo.cisloDomovni) {
      street += ` ${sidlo.cisloDomovni}`;
      if (sidlo.cisloOrientacni) {
        street += `/${sidlo.cisloOrientacni}${sidlo.cisloOrientacniPismeno ?? ''}`;
      }
    }
    parts.push(street);
  } else if (sidlo.cisloDomovni) {
    const prefix = sidlo.nazevCastiObce ?? sidlo.nazevObce ?? '';
    parts.push(`${prefix} ${sidlo.cisloDomovni}`);
  }

  if (
    sidlo.nazevMestskeCastiObvodu &&
    sidlo.nazevMestskeCastiObvodu !== sidlo.nazevObce
  ) {
    parts.push(sidlo.nazevMestskeCastiObvodu);
  }

  if (sidlo.psc || sidlo.nazevObce) {
    const zipCity = [sidlo.psc?.toString(), sidlo.nazevObce].filter(Boolean).join(' ');
    parts.push(zipCity);
  }

  return parts.join(', ') || 'N/A';
}

export function formatStreet(sidlo?: AresSidlo): string | null {
  if (!sidlo?.nazevUlice) return null;
  let street = sidlo.nazevUlice;
  if (sidlo.cisloDomovni) {
    street += ` ${sidlo.cisloDomovni}`;
    if (sidlo.cisloOrientacni) {
      street += `/${sidlo.cisloOrientacni}${sidlo.cisloOrientacniPismeno ?? ''}`;
    }
  }
  return street;
}

export function padIco(ico: string): string {
  return ico.padStart(8, '0');
}
