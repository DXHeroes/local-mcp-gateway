export interface IsirCase {
  idRizeni?: number;
  spisovaZnacka?: string;
  cisloSenatuDodatek?: string;
  soud?: string;
  druhStavRizeni?: string;
  datumZalozeni?: string;
  datumUkonceni?: string;
  dluznik?: {
    ic?: number;
    nazev?: string;
    mesto?: string;
  };
}

export interface IsirSearchResponse {
  list: IsirCase[];
  count: number;
  totalCount: number;
}
