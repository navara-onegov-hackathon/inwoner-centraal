import { useState } from 'react';
import { ArrowRight, ChevronRight, Euro, Paperclip, User } from 'lucide-react';

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

const quickLinks = [
  {
    id: 'identiteit',
    title: 'Identiteit',
    description: 'Uw gegevens, familie en identiteitsbewijs',
    icon: User,
  },
  {
    id: 'financien',
    title: 'Financiën',
    description: 'Uw inkomsten, toeslagen, schulden en belastingen',
    icon: Euro,
  },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const [showOrgAlert, setShowOrgAlert] = useState(true);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <h1 className="mb-8 text-[2rem] font-bold leading-tight text-gray-900">
        Welkom <span className="font-bold">Froukje</span>
      </h1>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-[15px] font-semibold text-gray-900">
            Recente berichten in uw Berichtenbox
          </h2>
        </div>

        {showOrgAlert && (
          <div className="border-b border-gray-200 bg-[#E8F4FC] px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-[#007AC8]">2 nieuwe organisaties</p>
                <button
                  type="button"
                  onClick={() => onNavigate?.('instellingen')}
                  className="mt-1 text-sm text-[#007AC8] underline hover:no-underline"
                >
                  Kies welke u digitale post mogen toesturen
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowOrgAlert(false)}
                className="text-[#007AC8]"
                aria-label="Melding sluiten"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <tbody>
              <tr
                className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                onClick={() => onNavigate?.('situatie')}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate?.('situatie')}
                tabIndex={0}
                role="link"
              >
                <td className="w-40 px-6 py-4 font-semibold text-gray-900">Mijn Overheid</td>
                <td className="px-4 py-4 text-gray-800">U bent nabestaande geworden, wat nu.</td>
                <td className="w-10 px-2 py-4 text-gray-500">
                  <Paperclip className="h-4 w-4" aria-hidden />
                </td>
                <td className="w-28 px-4 py-4 text-gray-700">31/07/2025</td>
                <td className="w-10 px-4 py-4 text-gray-400">
                  <ChevronRight className="h-5 w-5" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5">
          <button
            type="button"
            onClick={() => onNavigate?.('berichtenbox')}
            className="inline-flex items-center gap-2 rounded-md bg-[#007AC8] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Naar uw Berichtenbox
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

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
