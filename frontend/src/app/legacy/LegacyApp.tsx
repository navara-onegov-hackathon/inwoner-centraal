import { useState } from 'react';
import type { AppVersion } from '../shared/hooks/useAppVersion';
import { AppHeader } from '../shared/components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MijnSituatie } from './components/MijnSituatie';
import { SectionTemplate } from './components/SectionTemplate';

interface LegacyAppProps {
  version: AppVersion;
  onVersionChange: (version: AppVersion) => void;
}

export function LegacyApp({ version, onVersionChange }: LegacyAppProps) {
  const [activeSection, setActiveSection] = useState('home');
  const [loggedOut, setLoggedOut] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'situatie':
        return <MijnSituatie onNavigate={setActiveSection} />;
      default:
        return <SectionTemplate sectionId={activeSection} onNavigate={setActiveSection} />;
    }
  };

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
      <div className="flex min-h-0 flex-1">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="min-w-0 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
