import { useMemo, useState } from 'react';
import { AppHeader } from '../shared/components/AppHeader';
import { NextShell } from './components/layout/NextShell';
import { StartWizard } from './components/onboarding/StartWizard';
import { OverzichtPage } from './components/pages/OverzichtPage';
import { useBegeleidingsVoorkeur, useMeldingenVoorkeur, useOnboarding } from './hooks/useBegeleiding';
import { mockOverzicht } from './api/mockOverzicht';

export function NextApp() {
  const [loggedOut, setLoggedOut] = useState(false);
  const { completed, complete, reset } = useOnboarding();
  const { voorkeur, setVoorkeur } = useBegeleidingsVoorkeur();
  const { meldingen, setMeldingen } = useMeldingenVoorkeur();
  const persona = useMemo(() => mockOverzicht().persona, []);

  if (loggedOut) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
        <AppHeader onLogout={() => setLoggedOut(false)} />
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
        onLogout={() => setLoggedOut(true)}
        begeleidingVoorkeur={completed ? voorkeur : undefined}
        onBegeleidingChange={setVoorkeur}
        meldingenVoorkeur={completed ? meldingen : undefined}
        onMeldingenChange={setMeldingen}
        onResetOnboarding={reset}
      />
      <NextShell>
        {!completed ? (
          <StartWizard
            persona={persona}
            initialVoorkeur={voorkeur}
            initialMeldingen={meldingen}
            onVoorkeurChange={setVoorkeur}
            onMeldingenChange={setMeldingen}
            onComplete={complete}
            onRestartDemo={reset}
          />
        ) : (
          <OverzichtPage voorkeur={voorkeur} />
        )}
      </NextShell>
    </div>
  );
}
