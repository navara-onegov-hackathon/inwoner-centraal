import {
  Car,
  ChevronDown,
  ChevronUp,
  FileText,
  Landmark,
  Loader2,
  Shield,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ensureDemoCorrespondentie } from '../../lib/ensureDemoCorrespondentie';
import {
  mapCorrespondentieToBrievenView,
  type BrievenTabId,
  type BrievenViewItem,
} from '../../lib/mapCorrespondentieToBrievenView';
import { useOverzicht } from '../../hooks/useOverzicht';

interface BrievenPageProps {
  onBackToOverzicht: () => void;
}

const tabs: { id: BrievenTabId; label: string }[] = [
  { id: 'verzonden', label: 'Verzonden' },
  { id: 'verwacht', label: 'Verwacht' },
];

export function BrievenPage({ onBackToOverzicht }: BrievenPageProps) {
  const { data, error, loading } = useOverzicht();
  const [activeTab, setActiveTab] = useState<BrievenTabId>('verzonden');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [organization, setOrganization] = useState('alle');

  const view = useMemo(
    () => (data ? mapCorrespondentieToBrievenView(ensureDemoCorrespondentie(data)) : null),
    [data],
  );
  const activeItems = view?.tabs[activeTab] ?? [];

  const organisations = useMemo(() => {
    const orgs = new Set(activeItems.map((item) => item.organisatie));
    return Array.from(orgs).sort((a, b) => a.localeCompare(b));
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    if (organization === 'alle') return activeItems;
    return activeItems.filter((item) => item.organisatie.toLowerCase() === organization);
  }, [activeItems, organization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#007AC8]">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Laden..." />
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-900">
          {error ?? 'Brieven konden niet worden geladen.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={onBackToOverzicht}
          className="hover:text-[#007AC8] hover:underline"
        >
          Overzicht
        </button>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold text-gray-900">Correspondentie</span>
      </nav>

      <div className="mb-8">
        <div>
          <h1 className="text-[2rem] font-bold leading-tight text-gray-900">Correspondentie</h1>
          <p className="mt-1 text-sm text-gray-600">Welke post is al verzonden en wat komt nog.</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex gap-8 overflow-x-auto border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setExpandedId(null);
                setOrganization('alle');
              }}
              className={`shrink-0 border-b-2 px-1 pb-3 pt-4 text-[15px] transition-colors ${
                activeTab === tab.id
                  ? 'border-[#007AC8] font-semibold text-[#007AC8]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({view.counts[tab.id]})
            </button>
          ))}
        </div>

        <div className="border-b border-gray-100 px-6 py-5">
          <label className="flex max-w-xs flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-900">Organisatie</span>
            <select
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="min-w-[220px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="alle">Alle organisaties</option>
              {organisations.map((org) => (
                <option key={org} value={org.toLowerCase()}>
                  {org}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredItems.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-600">
              Geen brieven in deze weergave.
            </div>
          ) : (
            filteredItems.map((item) => (
              <BriefRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BriefRow({
  item,
  expanded,
  onToggle,
}: {
  item: BrievenViewItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = getOrgIcon(item.organisatie);

  return (
    <div className={expanded ? 'border-l-4 border-l-[#007AC8]' : 'bg-white'}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 px-6 py-4 text-left hover:bg-gray-50"
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900">{item.title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{item.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{item.organisatie}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          {item.status === 'verzonden' && (
            <span className="text-gray-600">{item.dateLabel}</span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-6 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailBlock label="Geadresseerde" value={formatAddressee(item.geadresseerde)} />
            <DetailBlock label="Reactietermijn" value={formatResponseTerm(item)} />
            <DetailBlock label="Adres" value={item.adresLabel} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatAddressee(value: string): string {
  switch (value) {
    case 'partner':
      return 'Partner';
    case 'erven':
      return 'Erven';
    case 'contactpersoon':
      return 'Contactpersoon';
    case 'overledene':
      return 'Overledene';
    default:
      return value;
  }
}

function formatResponseTerm(item: BrievenViewItem): string {
  if (!item.wettelijkeReactietermijnDagen) return 'Geen wettelijke termijn';
  return `${item.wettelijkeReactietermijnDagen} dagen`;
}

function getOrgIcon(organisatie: string): LucideIcon {
  switch (organisatie) {
    case 'Gemeente':
    case 'Belastingdienst':
      return Landmark;
    case 'RDW':
      return Car;
    case 'CAK':
      return Shield;
    case 'SVB':
      return Wallet;
    default:
      return FileText;
  }
}
