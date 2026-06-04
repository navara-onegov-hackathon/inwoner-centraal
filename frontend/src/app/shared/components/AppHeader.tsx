import type { AppVersion } from '../hooks/useAppVersion';
import { GovernmentLogo } from './GovernmentLogo';
import { UserMenu } from './UserMenu';
import { VersionToggle } from './VersionToggle';

interface AppHeaderProps {
  version: AppVersion;
  onVersionChange: (version: AppVersion) => void;
  onLogout?: () => void;
}

export function AppHeader({ version, onVersionChange, onLogout }: AppHeaderProps) {
  return (
    <header className="shrink-0 bg-white">
      <div className="relative flex min-h-[4.5rem] items-center justify-between px-8 py-3">
        <div className="relative z-10 flex min-w-[9.5rem] items-center">
          <VersionToggle version={version} onVersionChange={onVersionChange} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <GovernmentLogo />
        </div>

        <div className="relative z-10 min-w-[12rem] flex justify-end">
          <UserMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
