import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import type { OverzichtResponse } from '../types/overzicht';
import { deriveOverzicht } from '../lib/deriveOverzicht';

const DEMO_TODAY = '2025-04-20';

export function mockOverzicht(): OverzichtResponse {
  return deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
}
