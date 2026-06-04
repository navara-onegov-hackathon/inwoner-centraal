import { useEffect, useState } from 'react';
import type { Detailniveau } from '../types/overzicht';

const STORAGE_KEY = 'inwoner-centraal:detailniveau';

export function useDetailniveau() {
  const [detailniveau, setDetailniveau] = useState<Detailniveau>(() => {
    if (typeof window === 'undefined') return 'begeleide';
    return window.localStorage.getItem(STORAGE_KEY) === 'uitgebreide' ? 'uitgebreide' : 'begeleide';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, detailniveau);
  }, [detailniveau]);

  const toggle = () =>
    setDetailniveau((current) => (current === 'begeleide' ? 'uitgebreide' : 'begeleide'));

  return { detailniveau, toggle, isUitgebreid: detailniveau === 'uitgebreide' };
}
