import { Menu, X } from 'lucide-react';
import type { BegeleidingsVoorkeur, MeldingenVoorkeur } from '../../next/types/begeleiding';
import { GovernmentLogo } from './GovernmentLogo';
import { HelpMenu } from './HelpMenu';
import { InstellingenMenu } from './InstellingenMenu';
import { UserMenu } from './UserMenu';

interface AppHeaderProps {
  onLogout?: () => void;
  begeleidingVoorkeur?: BegeleidingsVoorkeur;
  onBegeleidingChange?: (v: BegeleidingsVoorkeur) => void;
  meldingenVoorkeur?: MeldingenVoorkeur;
  onMeldingenChange?: (v: MeldingenVoorkeur) => void;
  onResetOnboarding?: () => void;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  onSidebarClose?: () => void;
}

export function AppHeader({
  onLogout,
  begeleidingVoorkeur,
  onBegeleidingChange,
  meldingenVoorkeur,
  onMeldingenChange,
  onResetOnboarding,
  sidebarOpen = false,
  onSidebarToggle,
  onSidebarClose,
}: AppHeaderProps) {
  return (
    <header className="relative z-[60] shrink-0 overflow-visible bg-white">
      <div className="flex h-12 items-center justify-between px-6 lg:px-8">
        <div className="flex min-w-[8rem] items-center">
          {onSidebarToggle && (
            <button
              type="button"
              onClick={sidebarOpen ? onSidebarClose : onSidebarToggle}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              aria-label={sidebarOpen ? 'Menu sluiten' : 'Menu openen'}
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AC8]"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          )}
        </div>

        <div className="relative z-10 flex min-w-[12rem] items-center justify-end gap-3">
          <HelpMenu />
          {begeleidingVoorkeur && onBegeleidingChange && meldingenVoorkeur && onMeldingenChange && (
            <InstellingenMenu
              voorkeur={begeleidingVoorkeur}
              onChange={onBegeleidingChange}
              meldingen={meldingenVoorkeur}
              onMeldingenChange={onMeldingenChange}
              onResetOnboarding={onResetOnboarding}
            />
          )}
          <UserMenu onLogout={onLogout} />
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-0 z-[60] -translate-x-1/2">
        <GovernmentLogo />
      </div>
    </header>
  );
}
