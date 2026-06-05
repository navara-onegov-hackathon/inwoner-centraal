import { mockOverzicht } from '../api/mockOverzicht';
import type { OverzichtResponse } from '../types/overzicht';

export function ensureDemoCorrespondentie(overzicht: OverzichtResponse): OverzichtResponse {
  if (Array.isArray(overzicht.correspondentie) && overzicht.correspondentie.length > 0) {
    return overzicht;
  }

  return {
    ...overzicht,
    correspondentie: mockOverzicht().correspondentie,
  };
}
