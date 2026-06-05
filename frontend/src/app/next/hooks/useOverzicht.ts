import { useEffect, useState } from 'react';
import { fetchOverzicht } from '../api/fetchOverzicht';
import { OVERZICHT_STORAGE_KEY } from '../types/begeleiding';
import type { OverzichtResponse } from '../types/overzicht';

export function useOverzicht() {
  const [data, setData] = useState<OverzichtResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OVERZICHT_STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored) as OverzichtResponse);
        setLoading(false);
        return;
      }
    } catch {
      /* fall through to fetch */
    }
    fetchOverzicht()
      .then(setData)
      .catch(() => setError('Overzicht kon niet worden geladen.'))
      .finally(() => setLoading(false));
  }, []);

  return { data, error, loading, setData };
}
