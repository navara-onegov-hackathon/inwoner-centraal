import { useCallback, useEffect, useState } from 'react';
import {
  BEGELEIDING_STORAGE_KEY,
  DEFAULT_BEGELEIDING,
  DEFAULT_GEGEVENS,
  DEFAULT_MELDINGEN,
  GEGEVENS_STORAGE_KEY,
  MELDINGEN_STORAGE_KEY,
  ONBOARDING_STORAGE_KEY,
  OVERZICHT_STORAGE_KEY,
  normalizeBegeleidingsVoorkeur,
  normalizeGegevensProfiel,
  type BegeleidingsVoorkeur,
  type GegevensProfiel,
  type MeldingenVoorkeur,
} from '../types/begeleiding';

export function useOnboarding() {
  const [completed, setCompleted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  });

  const complete = useCallback((gegevens: GegevensProfiel) => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    window.localStorage.setItem(GEGEVENS_STORAGE_KEY, JSON.stringify(gegevens));
    setCompleted(true);
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    window.localStorage.removeItem(OVERZICHT_STORAGE_KEY);
    setCompleted(false);
  }, []);

  return { completed, complete, reset };
}

export function useGegevensProfiel() {
  const [gegevens, setGegevens] = useState<GegevensProfiel>(() => {
    if (typeof window === 'undefined') return DEFAULT_GEGEVENS;
    try {
      const stored = window.localStorage.getItem(GEGEVENS_STORAGE_KEY);
      if (stored) return normalizeGegevensProfiel(JSON.parse(stored));
    } catch {
      /* use default */
    }
    return DEFAULT_GEGEVENS;
  });

  return { gegevens, setGegevens };
}

export function useBegeleidingsVoorkeur() {
  const [voorkeur, setVoorkeurState] = useState<BegeleidingsVoorkeur>(() => {
    if (typeof window === 'undefined') return DEFAULT_BEGELEIDING;
    try {
      const stored = window.localStorage.getItem(BEGELEIDING_STORAGE_KEY);
      if (stored) return normalizeBegeleidingsVoorkeur(JSON.parse(stored));
    } catch {
      /* use default */
    }
    return DEFAULT_BEGELEIDING;
  });

  useEffect(() => {
    window.localStorage.setItem(BEGELEIDING_STORAGE_KEY, JSON.stringify(voorkeur));
  }, [voorkeur]);

  const setVoorkeur = useCallback((next: BegeleidingsVoorkeur) => {
    setVoorkeurState(next);
  }, []);

  const toggleOrgZelf = useCallback((organisatie: string) => {
    setVoorkeurState((current) => {
      const set = new Set(current.zelfRegelenOrganisaties);
      if (set.has(organisatie)) set.delete(organisatie);
      else set.add(organisatie);
      return { ...current, zelfRegelenOrganisaties: [...set] };
    });
  }, []);

  return { voorkeur, setVoorkeur, toggleOrgZelf };
}

export function useMeldingenVoorkeur() {
  const [meldingen, setMeldingenState] = useState<MeldingenVoorkeur>(() => {
    if (typeof window === 'undefined') return DEFAULT_MELDINGEN;
    try {
      const stored = window.localStorage.getItem(MELDINGEN_STORAGE_KEY);
      if (stored) return { ...DEFAULT_MELDINGEN, ...JSON.parse(stored) };
    } catch {
      /* use default */
    }
    return DEFAULT_MELDINGEN;
  });

  useEffect(() => {
    window.localStorage.setItem(MELDINGEN_STORAGE_KEY, JSON.stringify(meldingen));
  }, [meldingen]);

  const setMeldingen = useCallback((next: MeldingenVoorkeur) => {
    setMeldingenState(next);
  }, []);

  return { meldingen, setMeldingen };
}
