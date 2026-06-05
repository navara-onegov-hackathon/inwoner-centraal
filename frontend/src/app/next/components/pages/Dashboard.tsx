import { ChevronRight, HeartHandshake, ListChecks, Mail } from 'lucide-react';

interface DashboardProps {
  welcomeName: string;
  onNavigate?: (section: string) => void;
}

const quickLinks = [
  {
    id: 'stappenplan',
    title: 'Stappenplan',
    description: 'Zie wat u nu kunt regelen en wat wij voor u doen',
    icon: ListChecks,
  },
  {
    id: 'uitleg',
    title: 'Wat betekent dit voor u?',
    description: 'Uitleg over uw situatie als nabestaande',
    icon: HeartHandshake,
  },
  {
    id: 'berichtenbox',
    title: 'Berichtenbox',
    description: 'Al uw digitale post van de overheid',
    icon: Mail,
  },
];

export function Dashboard({ welcomeName, onNavigate }: DashboardProps) {
  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <h1 className="mb-8 text-[2rem] font-bold leading-tight text-gray-900">
        Welkom <span className="font-bold">{welcomeName}</span>
      </h1>

      <section>
        <h2 className="mb-4 text-[15px] font-semibold text-gray-900">Wat kan ik waar vinden?</h2>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate?.(link.id)}
                className={`flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50 ${
                  index < quickLinks.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DAEAF6]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007AC8] text-sm font-bold text-white">
                    <Icon className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-gray-900">{link.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-600">{link.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#007AC8]" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
