import { AresClient } from '../clients/ares-client.js';
import type {
  AresSubject,
  AresVrZaznam,
  AresVrClenOrganu,
  AresVrSpolecnik,
} from '../types/ares.js';
import type {
  CompanySearchResult,
  CompanyOverview,
  CompanyDetails,
  CompanyRelations,
  CompanyMember,
} from '../types/company.js';
import { formatAddress, formatStreet } from '../utils/formatters.js';

const LEGAL_FORMS: Record<string, string> = {
  '100': 'Podnikající fyzická osoba',
  '101': 'Veřejná obchodní společnost',
  '111': 'Veřejná obchodní společnost',
  '112': 'Společnost s ručením omezeným',
  '121': 'Akciová společnost',
  '141': 'Obecně prospěšná společnost',
  '205': 'Družstvo',
  '301': 'Státní podnik',
  '325': 'Organizační složka státu',
  '421': 'Zahraniční FO',
  '422': 'Zahraniční PO',
  '706': 'Spolek',
  '736': 'Pobočný spolek',
  '801': 'Obec',
};

function getLegalFormName(code?: string): string {
  if (!code) return 'Neznámá';
  return LEGAL_FORMS[code] ?? `Právní forma ${code}`;
}

function getActiveVrRecord(zaznamy?: AresVrZaznam[]): AresVrZaznam | undefined {
  if (!zaznamy?.length) return undefined;
  return zaznamy.find((z) => !z.datumVymazu) ?? zaznamy[0];
}

function formatCourtFile(vrRecord?: AresVrZaznam): string | null {
  const sz = vrRecord?.spisovaZnacka;
  if (!sz?.length) return null;
  const active = sz[sz.length - 1];
  if (!active) return null;
  const parts = [active.oddil, active.vlozka, active.soud].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

function formatVrMemberName(clen: AresVrClenOrganu): string {
  if (clen.fyzickaOsoba) {
    const fo = clen.fyzickaOsoba;
    const parts = [fo.titulPredJmenem, fo.jmeno, fo.prijmeni, fo.titulZaJmenem].filter(
      Boolean,
    );
    return parts.join(' ') || 'N/A';
  }
  if (clen.pravnickaOsoba) {
    return clen.pravnickaOsoba.obchodniJmeno ?? clen.pravnickaOsoba.ico ?? 'N/A';
  }
  return 'N/A';
}

function formatSpolecnikName(
  s: AresVrSpolecnik,
): { name: string; type: 'person' | 'company' } {
  const osoba = s.osoba;
  if (!osoba) return { name: 'N/A', type: 'person' };
  if (osoba.pravnickaOsoba) {
    return {
      name: osoba.pravnickaOsoba.obchodniJmeno ?? osoba.pravnickaOsoba.ico ?? 'N/A',
      type: 'company',
    };
  }
  if (osoba.fyzickaOsoba) {
    const fo = osoba.fyzickaOsoba;
    const parts = [fo.titulPredJmenem, fo.jmeno, fo.prijmeni, fo.titulZaJmenem].filter(
      Boolean,
    );
    return { name: parts.join(' ') || 'N/A', type: 'person' };
  }
  return { name: 'N/A', type: 'person' };
}

export class CompanyService {
  private ares = new AresClient();

  async search(query: string, limit: number): Promise<CompanySearchResult[]> {
    const response = await this.ares.searchSubjects(query, limit);
    return response.ekonomickeSubjekty.map((s: AresSubject) => ({
      ico: s.ico,
      name: s.obchodniJmeno,
      legalForm: s.pravniForma ? getLegalFormName(s.pravniForma) : null,
      address: formatAddress(s.sidlo),
      dateEstablished: s.datumVzniku ?? null,
    }));
  }

  async getOverview(ico: string): Promise<CompanyOverview | null> {
    const [subject, vr] = await Promise.all([
      this.ares.getSubject(ico),
      this.ares.getVrDetail(ico),
    ]);

    if (!subject) return null;

    const vrRecord = getActiveVrRecord(vr?.zaznamy);
    const capital = vrRecord?.zakladniKapital?.find((k) => k.vklad);

    return {
      ico: subject.ico,
      dic: subject.dic ?? null,
      name: subject.obchodniJmeno,
      legalForm: subject.pravniForma
        ? {
            code: subject.pravniForma,
            name: getLegalFormName(subject.pravniForma),
          }
        : null,
      address: {
        full: formatAddress(subject.sidlo),
        street: formatStreet(subject.sidlo),
        city: subject.sidlo?.nazevObce ?? null,
        zip: subject.sidlo?.psc?.toString() ?? null,
      },
      dateEstablished: subject.datumVzniku ?? null,
      courtFile: formatCourtFile(vrRecord) ?? this.extractCourtFile(subject),
      nace: subject.czNace ?? [],
      shareCapital: capital?.vklad
        ? {
            amount: parseInt(capital.vklad.hodnota ?? '0', 10),
            currency:
              capital.vklad.typObnos === 'KORUNY' ? 'CZK' : (capital.vklad.typObnos ?? 'CZK'),
            paidUp: null,
          }
        : null,
      registrationStatus: this.mapRegistrationStatus(subject),
    };
  }

  async getDetails(ico: string): Promise<CompanyDetails | null> {
    const [subject, rzp, vr] = await Promise.all([
      this.ares.getSubject(ico),
      this.ares.getRzpDetail(ico),
      this.ares.getVrDetail(ico),
    ]);

    if (!subject) return null;

    const vrRecord = getActiveVrRecord(vr?.zaznamy);
    const rzpRecord = rzp?.zaznamy?.[0];

    return {
      ico: subject.ico,
      name: subject.obchodniJmeno,
      naceActivities: subject.czNace ?? [],
      tradeLicenses: (rzpRecord?.zivnosti ?? []).map((z) => ({
        subject: z.predmetPodnikani ?? 'N/A',
        type: z.druhZivnosti ?? null,
        dateFrom: z.vznik ?? null,
        dateTo: z.zanik ?? null,
      })),
      businessActivities: [
        ...(vrRecord?.cinnosti?.predmetPodnikani ?? []),
        ...(vrRecord?.cinnosti?.predmetCinnosti ?? []),
      ]
        .filter((p) => !p.datumVymazu)
        .map((p) => p.hodnota)
        .filter((p): p is string => !!p),
    };
  }

  async getRelations(ico: string): Promise<CompanyRelations | null> {
    const [subject, vr] = await Promise.all([
      this.ares.getSubject(ico),
      this.ares.getVrDetail(ico),
    ]);

    if (!subject) return null;

    const vrRecord = getActiveVrRecord(vr?.zaznamy);

    const statutoryBodies = (vrRecord?.statutarniOrgany ?? []).map((org) => ({
      organName: org.nazevOrganu ?? 'Statutární orgán',
      representation: null as string | null,
      members: (org.clenoveOrganu ?? [])
        .filter((c) => !c.datumVymazu)
        .map(
          (clen): CompanyMember => ({
            name: formatVrMemberName(clen),
            role: clen.clenstvi?.funkce?.nazev ?? null,
            since: clen.clenstvi?.funkce?.vznikFunkce ?? clen.datumZapisu ?? null,
            until: clen.clenstvi?.funkce?.zanikFunkce ?? clen.datumVymazu ?? null,
            address: clen.fyzickaOsoba?.adresa
              ? formatAddress(clen.fyzickaOsoba.adresa)
              : null,
          }),
        ),
    }));

    const shareholders = (vrRecord?.spolecnici ?? []).flatMap((section) =>
      (section.spolecnik ?? [])
        .filter((s) => !s.datumVymazu)
        .map((s) => {
          const { name, type } = formatSpolecnikName(s);
          const activePodil = s.podil?.find((p) => !p.datumVymazu);
          return {
            name,
            type,
            share: activePodil
              ? {
                  amount: activePodil.vklad?.hodnota
                    ? parseInt(activePodil.vklad.hodnota, 10)
                    : null,
                  currency:
                    activePodil.vklad?.typObnos === 'KORUNY'
                      ? 'CZK'
                      : (activePodil.vklad?.typObnos ?? null),
                  percentage: activePodil.velikostPodilu?.hodnota
                    ? parseFloat(activePodil.velikostPodilu.hodnota)
                    : null,
                  paidUp: activePodil.splaceni?.hodnota
                    ? `${activePodil.splaceni.hodnota}%`
                    : null,
                }
              : null,
          };
        }),
    );

    return {
      ico: subject.ico,
      name: subject.obchodniJmeno,
      statutoryBodies,
      shareholders,
    };
  }

  private extractCourtFile(subject: AresSubject): string | null {
    const sz = subject.dalsiUdaje?.find((u) => u.datovyZdroj === 'vr')?.spisovaZnacka;
    if (!sz) return null;
    return typeof sz === 'string' ? sz : null;
  }

  private mapRegistrationStatus(subject: AresSubject): Record<string, string> {
    const reg = subject.seznamRegistraci;
    if (!reg) return {};
    const result: Record<string, string> = {};
    const mapping: Record<string, string> = {
      stavZdrojeVr: 'Obchodní rejstřík',
      stavZdrojeRes: 'RES',
      stavZdrojeRzp: 'Živnostenský rejstřík',
      stavZdrojeRos: 'ROS',
      stavZdrojeDph: 'DPH (VAT)',
      stavZdrojeCeu: 'Insolvenční rejstřík',
    };
    for (const [key, label] of Object.entries(mapping)) {
      const val = reg[key as keyof typeof reg];
      if (val) result[label] = val;
    }
    return result;
  }
}
