import { describe, expect, it } from 'vitest';
import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import { DEFAULT_BEGELEIDING } from '../types/begeleiding';
import { OVERZICHT_REFERENCE_DATE } from '../config/referenceDate';
import { deriveOverzicht } from './deriveOverzicht';
import { partitionOverzicht } from './partitionOverzicht';
import { buildStappenplanProgress, mapOverzichtToStappenplanTabs } from './mapOverzichtToStappenplanTabs';

const DEMO_TODAY = OVERZICHT_REFERENCE_DATE;

describe('mapOverzichtToStappenplanTabs', () => {
  const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
  const board = partitionOverzicht(overzicht, DEFAULT_BEGELEIDING);

  it('splits open user tasks into urgent and nog-te-doen', () => {
    const tabs = mapOverzichtToStappenplanTabs(board, overzicht, false, DEMO_TODAY);
    expect(tabs.urgent.length + tabs['nog-te-doen'].length).toBe(board.actie_van_u.length);
    expect(tabs.urgent.every((r) => r.urgent)).toBe(true);
    expect(tabs['nog-te-doen'].every((r) => !r.urgent)).toBe(true);
  });

  it('combines agent + geregeld rows in wat-doen-wij', () => {
    const tabs = mapOverzichtToStappenplanTabs(board, overzicht, false, DEMO_TODAY);
    expect(tabs['wat-doen-wij'].length).toBeGreaterThan(0);
    expect(tabs['wat-doen-wij'].some((r) => r.locked)).toBe(true);
  });

  it('buildStappenplanProgress reflects completed vs open steps', () => {
    const tabs = mapOverzichtToStappenplanTabs(board, overzicht, false, DEMO_TODAY);
    const progress = buildStappenplanProgress(tabs);
    const openCount = tabs.urgent.length + tabs['nog-te-doen'].length;

    expect(progress.totalCount).toBe(openCount + tabs.gedaan.length);
    expect(progress.completedCount).toBe(tabs.gedaan.length);
    expect(progress.percentage).toBeGreaterThanOrEqual(0);
    expect(progress.percentage).toBeLessThanOrEqual(100);
    expect(progress.userTasksComplete).toBe(openCount === 0);
  });
});
