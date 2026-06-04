import { User, LogOut } from 'lucide-react';
import { GovernmentLogo } from './GovernmentLogo';

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  return (
    <header className="bg-white">
      <div className="relative flex items-center justify-end px-8 py-3">
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <GovernmentLogo />
        </div>

        <div className="relative z-10 flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2 text-gray-900">
            <User className="h-5 w-5 text-gray-600" strokeWidth={1.75} />
            <span className="font-semibold">Froukje</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            <span>Uitloggen</span>
          </button>
        </div>
      </div>
    </header>
  );
}
