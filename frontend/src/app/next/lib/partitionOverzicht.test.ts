import { describe, expect, it } from 'vitest';
import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import { DEFAULT_BEGELEIDING } from '../types/begeleiding';
import { deriveOverzicht } from './deriveOverzicht';
import { partitionOverzicht, shouldShowInActieVanU } from './partitionOverzicht';

const DEMO_TODAY = '2025-04-20';

describe('partitionOverzicht', () => {
  const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);

  it('maximaal mode shows fewer user actions than zelf mode', () => {
    const maxBoard = partitionOverzicht(overzicht, DEFAULT_BEGELEIDING);
    const zelfBoard = partitionOverzicht(overzicht, { assistance: 'none', zelfRegelenOrganisaties: [] });
    expect(maxBoard.actie_van_u.length).toBeLessThan(zelfBoard.actie_van_u.length);
  });

  it('puts delegated tasks in geregeld_door_ons for maximaal', () => {
    const delegatedTaak = {
      ...overzicht.taken[0],
      handled_by: 'us' as const,
      state: 'pending' as const,
      status: 'in_behandeling' as const,
    };
    const board = partitionOverzicht(
      {
        ...overzicht,
        taken: overzicht.taken.map((taak) =>
          taak.id === delegatedTaak.id ? delegatedTaak : taak,
        ),
      },
      DEFAULT_BEGELEIDING,
    );
    expect(board.geregeld_door_ons.taken.length).toBeGreaterThan(0);
  });

  it('hides agent activity in zelf mode', () => {
    const board = partitionOverzicht(overzicht, { assistance: 'none', zelfRegelenOrganisaties: [] });
    expect(board.op_achtergrond).toHaveLength(0);
  });
});

describe('shouldShowInActieVanU', () => {
  it('returns true for all taken in zelf mode', () => {
    const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    const all = overzicht.taken.every((t) =>
      shouldShowInActieVanU(t, { assistance: 'none', zelfRegelenOrganisaties: [] }),
    );
    expect(all).toBe(true);
  });
});
