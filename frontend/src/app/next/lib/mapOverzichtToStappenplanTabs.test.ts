import { describe, expect, it } from 'vitest';
import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import { DEFAULT_BEGELEIDING } from '../types/begeleiding';
import { deriveOverzicht } from './deriveOverzicht';
import { partitionOverzicht } from './partitionOverzicht';
import { mapOverzichtToStappenplanTabs, pickUrgentRowIds } from './mapOverzichtToStappenplanTabs';

const DEMO_TODAY = '2025-04-20';

describe('mapOverzichtToStappenplanTabs', () => {
  const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
  const board = partitionOverzicht(overzicht, DEFAULT_BEGELEIDING);

  it('puts user-action taken in nog-te-doen', () => {
    const tabs = mapOverzichtToStappenplanTabs(board, overzicht, false);
    expect(tabs['nog-te-doen'].length).toBe(board.actie_van_u.length);
    expect(tabs['nog-te-doen'].every((r) => r.kind === 'taak')).toBe(true);
  });

  it('combines agent + geregeld rows in wat-doen-wij', () => {
    const tabs = mapOverzichtToStappenplanTabs(board, overzicht, false);
    expect(tabs['wat-doen-wij'].length).toBeGreaterThan(0);
    expect(tabs['wat-doen-wij'].some((r) => r.locked)).toBe(true);
  });

  it('maps verwacht items to recht-op tab', () => {
    const tabs = mapOverzichtToStappenplanTabs(board, overzicht, false);
    expect(tabs['recht-op'].length).toBe(board.wachten_op_organisatie.length);
  });

  it('pickUrgentRowIds returns at most 2 nog-te-doen ids', () => {
    const tabs = mapOverzichtToStappenplanTabs(board, overzicht, false);
    const urgent = pickUrgentRowIds(tabs['nog-te-doen']);
    expect(urgent.length).toBeLessThanOrEqual(2);
  });
});
