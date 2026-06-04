import type { BegeleidingsVoorkeur } from '../types/begeleiding';

export interface PlannedAgentStep {
  id: string;
  organisatie: string;
  omschrijving: string;
  voorWie: 'agent' | 'u';
}

const ALL_PLANNED: PlannedAgentStep[] = [
  {
    id: 'plan-svb',
    organisatie: 'SVB',
    omschrijving: 'Overlijdensuitkering controleren en automatisch laten verwerken',
    voorWie: 'agent',
  },
  {
    id: 'plan-cak',
    organisatie: 'CAK',
    omschrijving: 'CAK informeren over overlijden en openstaande WLZ-factuur in kaart brengen',
    voorWie: 'agent',
  },
  {
    id: 'plan-toeslagen-herziening',
    organisatie: 'Toeslagen',
    omschrijving: 'Herziening huur- en zorgtoeslag aanvragen op basis van nieuw inkomen',
    voorWie: 'agent',
  },
  {
    id: 'plan-toeslagen-terug',
    organisatie: 'Toeslagen',
    omschrijving: 'Bezwaartermijn en betaalregeling voor terugvordering onderzoeken',
    voorWie: 'agent',
  },
  {
    id: 'plan-belastingdienst',
    organisatie: 'Belastingdienst',
    omschrijving: 'Contactpersoon registreren en aangifte erfbelasting voorbereiden',
    voorWie: 'agent',
  },
  {
    id: 'plan-waterschap',
    organisatie: 'Waterschap',
    omschrijving: 'Aanslag waterschapsbelasting koppelen aan uw dossier',
    voorWie: 'agent',
  },
  {
    id: 'plan-rdw',
    organisatie: 'RDW',
    omschrijving: 'Voertuigregistratie op volledige naam controleren',
    voorWie: 'agent',
  },
  {
    id: 'plan-betalingen',
    organisatie: 'Diverse',
    omschrijving: 'Betalingen, ondertekeningen en aangiftes — alleen waar wettelijk verplicht',
    voorWie: 'u',
  },
];

export function getPlannedAgentSteps(voorkeur: BegeleidingsVoorkeur): PlannedAgentStep[] {
  if (voorkeur.niveau === 'zelf' || voorkeur.niveau === 'keuze') {
    return ALL_PLANNED.map((s) => ({
      ...s,
      voorWie: 'u' as const,
      omschrijving:
        s.voorWie === 'agent'
          ? `${s.omschrijving} — u doet dit zelf`
          : s.omschrijving,
    }));
  }

  return ALL_PLANNED;
}

export function countAgentSteps(steps: PlannedAgentStep[]) {
  return {
    agent: steps.filter((s) => s.voorWie === 'agent').length,
    u: steps.filter((s) => s.voorWie === 'u').length,
  };
}
