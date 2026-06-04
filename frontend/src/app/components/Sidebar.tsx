import {
  AlertCircle,
  Briefcase,
  Bus,
  CircleDot,
  CreditCard,
  GraduationCap,
  Heart,
  House,
  Inbox,
  Mail,
  Settings,
  User,
} from 'lucide-react';
import { menuItems } from '../sectionConfig';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const icons = {
  home: CircleDot,
  identiteit: User,
  financien: CreditCard,
  werk: Briefcase,
  gezondheid: Heart,
  wonen: House,
  vervoer: Bus,
  onderwijs: GraduationCap,
  'lopende-zaken': Inbox,
  berichtenbox: Mail,
  situatie: AlertCircle,
  instellingen: Settings,
} as const;

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#f7f7f7]">
      <div className="px-6 pb-5 pt-6">
        <p className="text-[1.625rem] font-bold leading-none tracking-[-0.02em] text-gray-900">
          MijnOverheid
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {menuItems.map((item) => {
          const Icon = icons[item.id as keyof typeof icons];
          const isActive = activeSection === item.id;
          const badge = 'badge' in item ? item.badge : undefined;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={`mb-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition-colors ${
                isActive
                  ? 'bg-[#DAEAF6] font-semibold text-[#154273]'
                  : 'font-normal text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="flex-1">{item.label}</span>
              {badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d52b1e] px-1 text-[11px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
