import type { AppVersion } from '../hooks/useAppVersion';
import type { BegeleidingsVoorkeur } from '../../next/types/begeleiding';
import { BegeleidingMenu } from './BegeleidingMenu';
import { GovernmentLogo } from './GovernmentLogo';
import { UserMenu } from './UserMenu';
import { VersionToggle } from './VersionToggle';

interface AppHeaderProps {
  version: AppVersion;
  onVersionChange: (version: AppVersion) => void;
  onLogout?: () => void;
  begeleidingVoorkeur?: BegeleidingsVoorkeur;
  onBegeleidingChange?: (v: BegeleidingsVoorkeur) => void;
  onResetOnboarding?: () => void;
  showVersionToggle?: boolean;
}

export function AppHeader({
  version,
  onVersionChange,
  onLogout,
  begeleidingVoorkeur,
  onBegeleidingChange,
  onResetOnboarding,
  showVersionToggle = true,
}: AppHeaderProps) {
  return (
    <header className="shrink-0 bg-white">
      <div className="relative flex min-h-[4.5rem] items-center justify-between px-8 py-3">
        <div className="relative z-10 flex min-w-[9.5rem] items-center">
          {showVersionToggle && (
            <VersionToggle version={version} onVersionChange={onVersionChange} />
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <GovernmentLogo />
        </div>

        <div className="relative z-10 flex min-w-[12rem] items-center justify-end gap-4">
          {begeleidingVoorkeur && onBegeleidingChange && (
            <BegeleidingMenu
              voorkeur={begeleidingVoorkeur}
              onChange={onBegeleidingChange}
              onResetOnboarding={onResetOnboarding}
            />
          )}
          <UserMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
