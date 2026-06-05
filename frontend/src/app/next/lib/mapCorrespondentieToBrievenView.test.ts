import { describe, expect, it } from 'vitest';
import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import { deriveOverzicht } from './deriveOverzicht';
import { mapCorrespondentieToBrievenView } from './mapCorrespondentieToBrievenView';

const DEMO_TODAY = '2025-04-20';

describe('mapCorrespondentieToBrievenView', () => {
  it('uses eight days after overlijden as reference date', () => {
    const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    const result = mapCorrespondentieToBrievenView(overzicht);

    expect(result.referenceDate).toBe('2025-03-23');
    expect(result.referenceSubtitle).toContain('8 dagen na overlijden');
  });

  it('splits letters into sent and expected by reference date', () => {
    const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    const result = mapCorrespondentieToBrievenView(overzicht);

    expect(result.tabs.verzonden.map((brief) => brief.organisatie)).toEqual([
      'Gemeente',
      'CAK',
      'RDW',
      'SVB',
    ]);
    expect(result.tabs.verwacht.map((brief) => brief.organisatie)).toEqual([
      'Toeslagen',
      'Belastingdienst',
      'Toeslagen',
      'CAK',
      'Waterschap',
      'Belastingdienst',
    ]);
  });

  it('keeps action-required future letters flagged', () => {
    const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    const result = mapCorrespondentieToBrievenView(overzicht);

    const actionLetters = result.tabs.verwacht.filter((brief) => brief.actieVereist);
    expect(actionLetters).toHaveLength(5);
    expect(actionLetters.map((brief) => brief.organisatie)).toContain('Waterschap');
    expect(result.counts.actieVereist).toBe(5);
  });
});
