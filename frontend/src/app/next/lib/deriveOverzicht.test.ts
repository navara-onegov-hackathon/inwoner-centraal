import { describe, expect, it } from 'vitest';
import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import { deriveOverzicht } from './deriveOverzicht';

const DEMO_TODAY = '2025-04-20';

describe('deriveOverzicht', () => {
  it('builds persona for Truus', () => {
    const result = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    expect(result.persona.nabestaande).toContain('Truus');
    expect(result.persona.overledene).toContain('Cees');
    expect(result.persona.postadres_alert).toBeTruthy();
  });

  it('deduplicates CAK brief and verplichting into one taak', () => {
    const result = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    const cakTaken = result.taken.filter((t) => t.organisatie === 'CAK');
    expect(cakTaken).toHaveLength(1);
    expect(cakTaken[0].bron_brief_ids.length).toBeGreaterThan(0);
    expect(cakTaken[0].bron_verplichting_ids.length).toBeGreaterThan(0);
  });

  it('puts confirmed SVB recht in regelingen', () => {
    const result = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    expect(result.regelingen.some((r) => r.organisatie === 'SVB')).toBe(true);
  });

  it('puts pending toeslagen recht in verwacht_binnenkort', () => {
    const result = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    expect(result.verwacht_binnenkort.some((v) => v.organisatie === 'Toeslagen')).toBe(true);
  });

  it('marks urgent taken with toon_cta_in_lijst when deadline within 14 days', () => {
    const result = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    const cak = result.taken.find((t) => t.id === 'taak-cak-wlz');
    expect(cak?.toon_cta_in_lijst).toBe(true);
    expect(cak?.cta_label).toMatch(/betal/i);
  });

  it('collects informational brieven as geen_actie_nodig', () => {
    const result = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    expect(result.geen_actie_nodig.length).toBeGreaterThan(0);
  });

  it('includes curated agentstappen with one in progress', () => {
    const result = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
    expect(result.agentstappen.length).toBeGreaterThanOrEqual(3);
    expect(result.agentstappen.some((s) => s.status === 'bezig')).toBe(true);
  });
});
