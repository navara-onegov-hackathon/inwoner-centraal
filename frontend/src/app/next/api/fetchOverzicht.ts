import type { OverzichtResponse } from '../types/overzicht';
import { mockOverzicht } from './mockOverzicht';

export async function fetchOverzicht(): Promise<OverzichtResponse> {
  // Swap when backend is ready:
  // const res = await fetch('/api/overzicht');
  // if (!res.ok) throw new Error('Overzicht kon niet worden geladen.');
  // return res.json();
  return mockOverzicht();
}
