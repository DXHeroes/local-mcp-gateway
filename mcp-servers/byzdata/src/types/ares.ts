export interface AresSidlo {
  kodStatu?: string;
  nazevStatu?: string;
  kodKraje?: number;
  nazevKraje?: string;
  kodOkresu?: number;
  nazevOkresu?: string;
  kodObce?: number;
  nazevObce?: string;
  kodSpravnihoObvodu?: number;
  nazevSpravnihoObvodu?: string;
  kodMestskehoObvodu?: number;
  nazevMestskehoObvodu?: string;
  kodMestskeCastiObvodu?: number;
  nazevMestskeCastiObvodu?: string;
  kodUlice?: number;
  nazevUlice?: string;
  cisloDomovni?: number;
  typCisloDomovni?: string;
  cisloOrientacni?: number;
  cisloOrientacniPismeno?: string;
  kodCastiObce?: number;
  nazevCastiObce?: string;
  kodAdresnihoMista?: number;
  psc?: number;
  textovaAdresa?: string;
}

export interface AresRegistrace {
  stavZdrojeVr?: string;
  stavZdrojeRes?: string;
  stavZdrojeRzp?: string;
  stavZdrojeRos?: string;
  stavZdrojeCeu?: string;
  stavZdrojeDph?: string;
  stavZdrojeSkDph?: string;
  stavZdrojeSd?: string;
  stavZdrojeIr?: string;
  stavZdrojeNrpzs?: string;
  stavZdrojeRpsh?: string;
  stavZdrojeRcns?: string;
  stavZdrojeSzr?: string;
  stavZdrojeRs?: string;
  stavZdrojeRed?: string;
  stavZdrojeMonitor?: string;
}

export interface AresDalsiUdaj {
  datovyZdroj?: string;
  spisovaZnacka?: string;
  pravniForma?: string;
  obpisovaZnacka?: string;
  [key: string]: unknown;
}

export interface AresSubject {
  ico: string;
  obchodniJmeno: string;
  dic?: string;
  pravniForma?: string;
  datumVzniku?: string;
  datumAktualizace?: string;
  financniUrad?: string;
  sidlo?: AresSidlo;
  adresaDorucovaci?: {
    radekAdresy1?: string;
    radekAdresy2?: string;
    radekAdresy3?: string;
  };
  czNace?: string[];
  czNace2008?: string[];
  seznamRegistraci?: AresRegistrace;
  dalsiUdaje?: AresDalsiUdaj[];
}

export interface AresSearchResponse {
  pocetCelkem: number;
  ekonomickeSubjekty: AresSubject[];
}

export interface AresFyzickaOsoba {
  jmeno?: string;
  prijmeni?: string;
  titulPredJmenem?: string;
  titulZaJmenem?: string;
  datumNarozeni?: string;
  statniObcanstvi?: string;
  adresa?: AresSidlo;
}

export interface AresPravnickaOsoba {
  ico?: string;
  obchodniJmeno?: string;
  adresa?: AresSidlo;
}

export interface AresVrSpisovaZnacka {
  datumZapisu?: string;
  soud?: string;
  oddil?: string;
  vlozka?: number;
}

export interface AresVrClenOrganu {
  datumZapisu?: string;
  datumVymazu?: string;
  typAngazma?: string;
  nazevAngazma?: string;
  fyzickaOsoba?: AresFyzickaOsoba;
  pravnickaOsoba?: AresPravnickaOsoba;
  clenstvi?: {
    funkce?: {
      vznikFunkce?: string;
      zanikFunkce?: string;
      nazev?: string;
    };
  };
}

export interface AresVrStatutarniOrgan {
  datumZapisu?: string;
  nazevOrganu?: string;
  pocetClenu?: { pocetClenu?: number; typ?: string }[];
  clenoveOrganu?: AresVrClenOrganu[];
}

export interface AresVrSpolecnikOsoba {
  datumZapisu?: string;
  datumVymazu?: string;
  typAngazma?: string;
  nazevAngazma?: string;
  clenstvi?: Record<string, unknown>;
  fyzickaOsoba?: AresFyzickaOsoba;
  pravnickaOsoba?: AresPravnickaOsoba;
}

export interface AresVrPodil {
  datumZapisu?: string;
  datumVymazu?: string;
  vklad?: { typObnos?: string; hodnota?: string };
  velikostPodilu?: { typObnos?: string; hodnota?: string };
  splaceni?: { typObnos?: string; hodnota?: string };
}

export interface AresVrSpolecnik {
  datumZapisu?: string;
  datumVymazu?: string;
  podil?: AresVrPodil[];
  osoba?: AresVrSpolecnikOsoba;
}

export interface AresVrSpolecniciSection {
  datumZapisu?: string;
  nazevOrganu?: string;
  spolecnik?: AresVrSpolecnik[];
}

export interface AresVrZakladniKapital {
  datumZapisu?: string;
  typJmeni?: string;
  vklad?: { typObnos?: string; hodnota?: string };
}

export interface AresVrCinnostItem {
  datumZapisu?: string;
  datumVymazu?: string;
  hodnota?: string;
}

export interface AresVrCinnosti {
  predmetPodnikani?: AresVrCinnostItem[];
  predmetCinnosti?: AresVrCinnostItem[];
}

export interface AresVrZaznam {
  rejstrik?: string;
  ico?: string;
  obchodniJmeno?: string[];
  spisovaZnacka?: AresVrSpisovaZnacka[];
  pravniForma?: string;
  datumZapisu?: string;
  datumVymazu?: string;
  adresy?: AresSidlo[];
  cinnosti?: AresVrCinnosti;
  statutarniOrgany?: AresVrStatutarniOrgan[];
  ostatniOrgany?: AresVrStatutarniOrgan[];
  zakladniKapital?: AresVrZakladniKapital[];
  spolecnici?: AresVrSpolecniciSection[];
  zpusobRizeni?: { datumZapisu?: string; typ?: string }[];
}

export interface AresVrResponse {
  ico: string;
  zaznamy?: AresVrZaznam[];
}

export interface AresZivnost {
  predmetPodnikani?: string;
  druhZivnosti?: string;
  vznik?: string;
  zanik?: string;
  odpovednyZastupce?: string;
  provozovny?: AresProvozovna[];
}

export interface AresProvozovna {
  adresa?: AresSidlo;
  predmetPodnikani?: string;
  zahajeniProvozovani?: string;
  ukonceniProvozovani?: string;
}

export interface AresRzpZaznam {
  zivnosti?: AresZivnost[];
}

export interface AresRzpResponse {
  ico: string;
  zaznamy?: AresRzpZaznam[];
}
