import { useState } from 'react';
import { ChevronRight, Paperclip } from 'lucide-react';
import { berichtenboxMessages } from '../../data/berichtenboxMessages';

interface BerichtenboxPageProps {
  onNavigate?: (section: string) => void;
}

export function BerichtenboxPage({ onNavigate }: BerichtenboxPageProps) {
  const [showOrgAlert, setShowOrgAlert] = useState(true);

  const handleMessageClick = (navigateTo?: string) => {
    if (navigateTo) onNavigate?.(navigateTo);
  };

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          className="hover:text-[#007AC8] hover:underline"
        >
          Overzicht
        </button>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold text-gray-900">Berichtenbox</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[2rem] font-bold leading-tight text-gray-900">Berichtenbox</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-600">
          Al uw digitale post van organisaties van de overheid op één plek.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {showOrgAlert && (
          <div className="border-b border-gray-200 bg-[#E8F4FC] px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-[#007AC8]">2 nieuwe organisaties</p>
                <p className="mt-1 text-sm text-[#007AC8]">
                  Kies welke u digitale post mogen toesturen
                </p>
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
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3" scope="col">
                  Afzender
                </th>
                <th className="px-4 py-3" scope="col">
                  Onderwerp
                </th>
                <th className="w-10 px-2 py-3" scope="col">
                  <span className="sr-only">Bijlage</span>
                </th>
                <th className="w-28 px-4 py-3" scope="col">
                  Datum
                </th>
                <th className="w-10 px-4 py-3" scope="col">
                  <span className="sr-only">Openen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {berichtenboxMessages.map((message) => (
                <tr
                  key={message.id}
                  className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                    message.unread ? 'bg-[#F8FBFE]' : ''
                  }`}
                  onClick={() => handleMessageClick(message.navigateTo)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMessageClick(message.navigateTo)}
                  tabIndex={0}
                  role="link"
                >
                  <td className="px-6 py-4">
                    <span className={message.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}>
                      {message.afzender}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={message.unread ? 'font-semibold text-gray-900' : 'text-gray-800'}>
                      {message.onderwerp}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-gray-500">
                    {message.hasAttachment && <Paperclip className="h-4 w-4" aria-label="Bijlage" />}
                  </td>
                  <td className="px-4 py-4 text-gray-700">{message.datum}</td>
                  <td className="px-4 py-4 text-gray-400">
                    <ChevronRight className="h-5 w-5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
