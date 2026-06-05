import { useMemo, useState } from 'react';
import { AppHeader } from '../shared/components/AppHeader';
import { SlideOutSidebar } from '../shared/components/SlideOutSidebar';
import { NextShell } from './components/layout/NextShell';
import { StartWizard } from './components/onboarding/StartWizard';
import { BerichtenboxPage } from './components/pages/BerichtenboxPage';
import { BrievenPage } from './components/pages/BrievenPage';
import { Dashboard } from './components/pages/Dashboard';
import { OverzichtPage } from './components/pages/OverzichtPage';
import { WatBetekentPage } from './components/pages/WatBetekentPage';
import { useBegeleidingsVoorkeur, useGegevensProfiel, useMeldingenVoorkeur, useOnboarding } from './hooks/useBegeleiding';
import { mockOverzicht } from './api/mockOverzicht';
import { ONBOARDING_STORAGE_KEY } from './types/begeleiding';

export function NextApp() {
  const [loggedOut, setLoggedOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true' ? 'stappenplan' : 'home';
  });
  const { completed, complete, reset } = useOnboarding();
  const { gegevens } = useGegevensProfiel();
  const { voorkeur, setVoorkeur } = useBegeleidingsVoorkeur();
  const { meldingen, setMeldingen } = useMeldingenVoorkeur();
  const persona = useMemo(() => mockOverzicht().persona, []);

  const welcomeName =
    gegevens.volledigeNaam.split(' ')[0] || persona.nabestaande.split(' ')[0];

  const handleComplete = (profile: Parameters<typeof complete>[0]) => {
    complete(profile);
    setActiveSection('stappenplan');
  };

  const resetOnboarding = () => {
    setActiveSection('stappenplan');
    reset();
  };

  const renderContent = () => {
    if (!completed) {
      return (
        <StartWizard
          persona={persona}
          initialVoorkeur={voorkeur}
          initialMeldingen={meldingen}
          onVoorkeurChange={setVoorkeur}
          onMeldingenChange={setMeldingen}
          onComplete={handleComplete}
          onRestartDemo={resetOnboarding}
        />
      );
    }

    switch (activeSection) {
      case 'home':
        return <Dashboard welcomeName={welcomeName} onNavigate={setActiveSection} />;
      case 'berichtenbox':
        return <BerichtenboxPage onNavigate={setActiveSection} />;
      case 'brieven':
        return <BrievenPage onBackToOverzicht={() => setActiveSection('stappenplan')} />;
      case 'stappenplan':
        return <OverzichtPage voorkeur={voorkeur} onNavigate={setActiveSection} />;
      case 'uitleg':
        return <WatBetekentPage onNavigate={setActiveSection} />;
      default:
        return <Dashboard welcomeName={welcomeName} onNavigate={setActiveSection} />;
    }
  };

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
        onResetOnboarding={resetOnboarding}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(true)}
        onSidebarClose={() => setSidebarOpen(false)}
      />
      <SlideOutSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <NextShell>{renderContent()}</NextShell>
    </div>
  );
}
