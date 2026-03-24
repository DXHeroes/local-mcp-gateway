export interface CompanySearchResult {
  ico: string;
  name: string;
  legalForm: string | null;
  address: string | null;
  dateEstablished: string | null;
}

export interface CompanyOverview {
  ico: string;
  dic: string | null;
  name: string;
  legalForm: { code: string; name: string } | null;
  address: {
    full: string;
    street: string | null;
    city: string | null;
    zip: string | null;
  };
  dateEstablished: string | null;
  courtFile: string | null;
  nace: string[];
  shareCapital: {
    amount: number;
    currency: string;
    paidUp: string | null;
  } | null;
  registrationStatus: Record<string, string>;
}

export interface CompanyDetails {
  ico: string;
  name: string;
  naceActivities: string[];
  tradeLicenses: {
    subject: string;
    type: string | null;
    dateFrom: string | null;
    dateTo: string | null;
  }[];
  businessActivities: string[];
}

export interface CompanyMember {
  name: string;
  role: string | null;
  since: string | null;
  until: string | null;
  address: string | null;
}

export interface CompanyRelations {
  ico: string;
  name: string;
  statutoryBodies: {
    organName: string;
    representation: string | null;
    members: CompanyMember[];
  }[];
  shareholders: {
    name: string;
    type: 'person' | 'company';
    share: {
      amount: number | null;
      currency: string | null;
      percentage: number | null;
      paidUp: string | null;
    } | null;
  }[];
}
