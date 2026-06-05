export type AssistanceLevel = 'max' | 'none';

export interface BegeleidingsVoorkeur {
  assistance: AssistanceLevel;
  zelfRegelenOrganisaties: string[];
}

export interface AdresGegevens {
  straat: string;
  huisnummer: string;
  postcode: string;
  woonplaats: string;
}

export interface GegevensProfiel {
  volledigeNaam: string;
  adres: AdresGegevens;
  bsn: string;
  iban: string;
}

export const DELEGATIE_ORGANISATIES = [
  'SVB',
  'CAK',
  'Toeslagen',
  'Belastingdienst',
  'Waterschap',
  'RDW',
  'Gemeente',
] as const;

export const DEFAULT_BEGELEIDING: BegeleidingsVoorkeur = {
  assistance: 'max',
  zelfRegelenOrganisaties: [],
};

export const DEFAULT_GEGEVENS: GegevensProfiel = {
  volledigeNaam: 'Truus de Vries-Bakker',
  adres: {
    straat: 'Hoofdstraat',
    huisnummer: '42',
    postcode: '3512 CD',
    woonplaats: 'Utrecht',
  },
  bsn: '999888777',
  iban: 'NL91 ABNA 0417 1643 00',
};

export function formatAdres(adres: AdresGegevens): string {
  return `${adres.straat} ${adres.huisnummer}, ${adres.postcode} ${adres.woonplaats}`;
}

export function maskBsn(bsn: string): string {
  const digits = bsn.replace(/\D/g, '');
  if (digits.length < 4) return bsn;
  return `***-**-${digits.slice(-3)}`;
}

export function maskIban(iban: string): string {
  const compact = iban.replace(/\s/g, '');
  if (compact.length < 8) return iban;
  return `${compact.slice(0, 4)} •••• •••• ${compact.slice(-4)}`;
}

/** Accept legacy localStorage shape with flat `adres` string */
export function normalizeGegevensProfiel(raw: unknown): GegevensProfiel {
  if (!raw || typeof raw !== 'object') return DEFAULT_GEGEVENS;
  const o = raw as Record<string, unknown>;

  let adres: AdresGegevens = DEFAULT_GEGEVENS.adres;
  if (o.adres && typeof o.adres === 'object') {
    const a = o.adres as Partial<AdresGegevens>;
    adres = {
      straat: a.straat ?? DEFAULT_GEGEVENS.adres.straat,
      huisnummer: a.huisnummer ?? DEFAULT_GEGEVENS.adres.huisnummer,
      postcode: a.postcode ?? DEFAULT_GEGEVENS.adres.postcode,
      woonplaats: a.woonplaats ?? DEFAULT_GEGEVENS.adres.woonplaats,
    };
  } else if (typeof o.adres === 'string') {
    adres = parseLegacyAdresString(o.adres);
  }

  return {
    volledigeNaam:
      typeof o.volledigeNaam === 'string' ? o.volledigeNaam : DEFAULT_GEGEVENS.volledigeNaam,
    adres,
    bsn: typeof o.bsn === 'string' ? o.bsn : DEFAULT_GEGEVENS.bsn,
    iban: typeof o.iban === 'string' ? o.iban : DEFAULT_GEGEVENS.iban,
  };
}

function parseLegacyAdresString(value: string): AdresGegevens {
  const match = value.match(/^(.+?)\s+(\S+),\s*(\d{4}\s*[A-Z]{2})\s+(.+)$/i);
  if (match) {
    return {
      straat: match[1],
      huisnummer: match[2],
      postcode: match[3].replace(/\s+/, ' '),
      woonplaats: match[4],
    };
  }
  return { ...DEFAULT_GEGEVENS.adres, straat: value };
}

export interface MeldingenVoorkeur {
  governmentSupport: boolean;
  suggestions: boolean;
  emailSteps: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export const DEFAULT_MELDINGEN: MeldingenVoorkeur = {
  governmentSupport: true,
  suggestions: true,
  emailSteps: true,
  emailNotifications: false,
  inAppNotifications: false,
};

export function normalizeBegeleidingsVoorkeur(raw: unknown): BegeleidingsVoorkeur {
  if (!raw || typeof raw !== 'object') return DEFAULT_BEGELEIDING;
  const value = raw as Record<string, unknown>;
  const legacy = typeof value.niveau === 'string' ? value.niveau : null;
  const rawAssistance =
    typeof value.assistance === 'string'
      ? value.assistance
      : legacy === 'maximaal'
        ? 'max'
        : legacy === 'zelf' || legacy === 'keuze'
          ? 'none'
          : DEFAULT_BEGELEIDING.assistance;
  const assistance = rawAssistance === 'partial' ? 'none' : rawAssistance;
  return {
    assistance:
      assistance === 'max' || assistance === 'none' ? assistance : DEFAULT_BEGELEIDING.assistance,
    zelfRegelenOrganisaties: Array.isArray(value.zelfRegelenOrganisaties)
      ? value.zelfRegelenOrganisaties.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

export const BEGELEIDING_LABELS: Record<AssistanceLevel, string> = {
  max: 'Maximaal',
  none: 'Zelf regelen',
};

export const ONBOARDING_STORAGE_KEY = 'inwoner-centraal:onboarding-complete';
export const BEGELEIDING_STORAGE_KEY = 'inwoner-centraal:begeleidings-voorkeur';
export const GEGEVENS_STORAGE_KEY = 'inwoner-centraal:gegevens-profiel';
export const MELDINGEN_STORAGE_KEY = 'inwoner-centraal:meldingen-voorkeur';
export const OVERZICHT_STORAGE_KEY = 'inwoner-centraal:overzicht';
export const CASE_DATA_STORAGE_KEY = 'inwoner-centraal:case-data';
