import { LogOut, User } from 'lucide-react';

interface UserMenuProps {
  onLogout?: () => void;
}

export function UserMenu({ onLogout }: UserMenuProps) {
  return (
    <div className="flex items-center gap-5 text-sm">
      <div className="flex items-center gap-2 text-gray-900">
        <User className="h-5 w-5 text-gray-600" strokeWidth={1.75} />
        <span className="font-semibold">Truus</span>
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
  );
}
