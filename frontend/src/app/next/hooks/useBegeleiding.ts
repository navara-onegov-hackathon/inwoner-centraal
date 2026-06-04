import { useCallback, useEffect, useState } from 'react';
import {
  BEGELEIDING_STORAGE_KEY,
  DEFAULT_BEGELEIDING,
  ONBOARDING_STORAGE_KEY,
  POSTADRES_STORAGE_KEY,
  type BegeleidingsVoorkeur,
  type PostadresKeuze,
} from '../types/begeleiding';

export function useOnboarding() {
  const [completed, setCompleted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  });

  const complete = useCallback((postadresKeuze: PostadresKeuze) => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    window.localStorage.setItem(POSTADRES_STORAGE_KEY, postadresKeuze);
    setCompleted(true);
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setCompleted(false);
  }, []);

  return { completed, complete, reset };
}

export function usePostadresKeuze() {
  const [keuze, setKeuze] = useState<PostadresKeuze | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(POSTADRES_STORAGE_KEY);
    return stored as PostadresKeuze | null;
  });

  return { postadresKeuze: keuze, setPostadresKeuze: setKeuze };
}

export function useBegeleidingsVoorkeur() {
  const [voorkeur, setVoorkeurState] = useState<BegeleidingsVoorkeur>(() => {
    if (typeof window === 'undefined') return DEFAULT_BEGELEIDING;
    try {
      const stored = window.localStorage.getItem(BEGELEIDING_STORAGE_KEY);
      if (stored) return JSON.parse(stored) as BegeleidingsVoorkeur;
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
