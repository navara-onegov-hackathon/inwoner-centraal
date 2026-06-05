import { HeartHandshake, LayoutGrid, ListChecks, Mail, X } from 'lucide-react';
import { menuItems } from '../config/sectionConfig';

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onClose?: () => void;
}

const icons = {
  home: LayoutGrid,
  berichtenbox: Mail,
  stappenplan: ListChecks,
  uitleg: HeartHandshake,
} as const;

export function AppSidebar({ activeSection, onSectionChange, onClose }: AppSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col bg-[#f7f7f7]">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200/70 px-5 py-4">
        <p className="text-[15px] font-light tracking-[0.02em] text-gray-600">Navigatie</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Menu sluiten"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AC8]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 pb-4 pt-4" aria-label="Hoofdnavigatie">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = icons[item.id as keyof typeof icons];
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-[#DAEAF6] text-[#154273]'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      isActive ? 'bg-[#007AC8]/15 text-[#007AC8]' : 'bg-white text-gray-500 shadow-sm'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] leading-snug ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    <span className={`mt-0.5 block text-xs leading-snug ${isActive ? 'text-[#154273]/80' : 'text-gray-500'}`}>
                      {item.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
