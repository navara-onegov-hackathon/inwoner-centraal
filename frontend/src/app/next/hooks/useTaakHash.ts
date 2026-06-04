import { useCallback, useEffect, useState } from 'react';

export function useTaakHash() {
  const [openTaakId, setOpenTaakId] = useState<string | null>(() => parseHash());

  useEffect(() => {
    const onHashChange = () => setOpenTaakId(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openTaak = useCallback((id: string) => {
    window.location.hash = `taak/${id}`;
    setOpenTaakId(id);
  }, []);

  const closeTaak = useCallback(() => {
    history.pushState(null, '', window.location.pathname + window.location.search);
    setOpenTaakId(null);
  }, []);

  return { openTaakId, openTaak, closeTaak };
}

function parseHash(): string | null {
  const match = window.location.hash.match(/^#taak\/(.+)$/);
  return match?.[1] ?? null;
}
