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
}

export function AppHeader({
  onLogout,
  begeleidingVoorkeur,
  onBegeleidingChange,
  meldingenVoorkeur,
  onMeldingenChange,
  onResetOnboarding,
}: AppHeaderProps) {
  return (
    <header className="relative z-50 shrink-0 overflow-visible bg-white">
      <div className="flex h-12 items-center justify-between px-6 lg:px-8">
        <div className="min-w-[8rem]" aria-hidden />

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
