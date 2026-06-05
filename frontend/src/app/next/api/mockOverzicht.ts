import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import type { OverzichtResponse } from '../types/overzicht';
import { deriveOverzicht } from '../lib/deriveOverzicht';

import { OVERZICHT_REFERENCE_DATE } from '../config/referenceDate';

const DEMO_TODAY = OVERZICHT_REFERENCE_DATE;

export function mockOverzicht(): OverzichtResponse {
  return deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
}
