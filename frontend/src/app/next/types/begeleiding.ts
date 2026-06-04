export type Begeleidingsniveau = 'maximaal' | 'zelf' | 'keuze';

export type PostadresKeuze = 'thuisadres' | 'huidige_situatie' | 'later';

export interface BegeleidingsVoorkeur {
  niveau: Begeleidingsniveau;
  /** Organisations the user wants to handle themselves (when niveau === 'keuze') */
  zelfRegelenOrganisaties: string[];
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
  niveau: 'maximaal',
  zelfRegelenOrganisaties: [],
};

export const BEGELEIDING_LABELS: Record<Begeleidingsniveau, string> = {
  maximaal: 'Maximaal',
  zelf: 'Zelf regelen',
  keuze: 'Per organisatie',
};

export interface OnboardingState {
  completed: boolean;
  postadresKeuze: PostadresKeuze | null;
}

export const ONBOARDING_STORAGE_KEY = 'inwoner-centraal:onboarding-complete';
export const BEGELEIDING_STORAGE_KEY = 'inwoner-centraal:begeleidings-voorkeur';
export const POSTADRES_STORAGE_KEY = 'inwoner-centraal:postadres-keuze';
