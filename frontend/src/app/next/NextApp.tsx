import { useState } from 'react';
import type { AppVersion } from '../shared/hooks/useAppVersion';
import { AppHeader } from '../shared/components/AppHeader';
import { NextShell } from './components/layout/NextShell';
import { HomePage } from './components/pages/HomePage';

interface NextAppProps {
  version: AppVersion;
  onVersionChange: (version: AppVersion) => void;
}

export function NextApp({ version, onVersionChange }: NextAppProps) {
  const [loggedOut, setLoggedOut] = useState(false);

  if (loggedOut) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
        <AppHeader
          version={version}
          onVersionChange={onVersionChange}
          onLogout={() => setLoggedOut(false)}
        />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">U bent uitgelogd</h1>
            <p className="mb-6 text-sm text-gray-600">Bedankt voor het gebruik van MijnOverheid.</p>
            <button
              type="button"
              onClick={() => setLoggedOut(false)}
              className="rounded-md bg-[#007AC8] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Opnieuw inloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#f7f7f7]">
      <AppHeader
        version={version}
        onVersionChange={onVersionChange}
        onLogout={() => setLoggedOut(true)}
      />
      <NextShell>
        <HomePage />
      </NextShell>
    </div>
  );
}
