import { describe, expect, it } from 'vitest';
import { mockOverzicht } from '../api/mockOverzicht';
import { ensureDemoCorrespondentie } from './ensureDemoCorrespondentie';

describe('ensureDemoCorrespondentie', () => {
  it('fills demo correspondence when overview has none', () => {
    const overview = { ...mockOverzicht(), correspondentie: [] };
    const result = ensureDemoCorrespondentie(overview);

    expect(result.correspondentie.length).toBeGreaterThan(0);
  });

  it('keeps existing correspondence when present', () => {
    const overview = mockOverzicht();
    const result = ensureDemoCorrespondentie(overview);

    expect(result).toBe(overview);
  });
});
