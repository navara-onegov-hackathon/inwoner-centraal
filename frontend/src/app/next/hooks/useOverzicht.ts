import { useEffect, useState } from 'react';
import { fetchOverzicht } from '../api/fetchOverzicht';
import type { OverzichtResponse } from '../types/overzicht';

export function useOverzicht() {
  const [data, setData] = useState<OverzichtResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverzicht()
      .then(setData)
      .catch(() => setError('Overzicht kon niet worden geladen.'))
      .finally(() => setLoading(false));
  }, []);

  return { data, error, loading };
}
