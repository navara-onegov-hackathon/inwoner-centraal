import { useEffect, useState } from 'react';

export type AppVersion = 'next' | 'legacy';

const STORAGE_KEY = 'inwoner-centraal:app-version';

export function getStoredVersion(): AppVersion {
  if (typeof window === 'undefined') return 'next';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'legacy' ? 'legacy' : 'next';
}

export function storeVersion(version: AppVersion) {
  window.localStorage.setItem(STORAGE_KEY, version);
}

export function useAppVersion() {
  const [version, setVersionState] = useState<AppVersion>(() => getStoredVersion());

  useEffect(() => {
    storeVersion(version);
  }, [version]);

  const setVersion = (next: AppVersion) => {
    setVersionState(next);
  };

  return { version, setVersion };
}
