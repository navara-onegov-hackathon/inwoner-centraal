import { useMemo, useState } from 'react';
import {
  Car,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Landmark,
  Lock,
  Mail,
  Shield,
  TrendingUp,
} from 'lucide-react';

type TabId = 'nog-te-doen' | 'gedaan' | 'wat-doen-wij' | 'recht-op';

interface StepItem {
  id: number;
  title: string;
  description: string;
  icon: typeof FileText;
  organization?: string;
  posted?: string;
  deadline?: string;
  detail?: string;
  locked?: boolean;
  completed?: boolean;
}

const allSteps: StepItem[] = [
  {
    id: 1,
    title: 'Akte van overlijden aanvragen',
    description: 'U heeft de overlijdensakte nodig om zaken te regelen.',
    icon: FileText,
    organization: 'Gemeente',
    posted: '24 april 2025',
    deadline: '18 mei 2026',
    detail: 'Vraag de overlijdensakte op bij de gemeente waar het overlijden is aangegeven.',
  },
  {
    id: 2,
    title: 'Verklaring van erfrecht aanvragen',
    description: 'Een verklaring van erfrecht laat zien wie de erfgenamen zijn.',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Nabestaandenmachtiging aanvragen',
    description: 'Met deze machtiging kunt u namens de overledene zaken regelen.',
    icon: Info,
    locked: true,
  },
  {
    id: 4,
    title: 'Kenteken op naam zetten',
    description: 'Zet het kenteken van de auto op uw naam.',
    icon: Car,
    locked: true,
  },
  {
    id: 5,
    title: 'Voorlopige aanslag wijzigen of stoppen',
    description: 'Pas de voorlopige aanslag inkomstenbelasting aan.',
    icon: Landmark,
    locked: true,
  },
  {
    id: 6,
    title: 'Geadresseerde reclamepost stopzetten',
    description: 'Stop reclamepost op naam van de overledene.',
    icon: Mail,
    locked: true,
  },
  {
    id: 7,
    title: 'Abonnementen en contracten opzeggen of wijzigen',
    description: 'Denk aan telefoon, internet en andere abonnementen.',
    icon: FileText,
    locked: true,
  },
  {
    id: 8,
    title: 'Verzekeringen aanpassen of opzeggen',
    description: 'Pas verzekeringen van de overledene aan of zeg ze op.',
    icon: Shield,
    locked: true,
  },
  {
    id: 9,
    title: 'Overlijden melden bij hypotheekverstrekker',
    description: 'Meld het overlijden bij de hypotheekverstrekker.',
    icon: TrendingUp,
    locked: true,
  },
  {
    id: 10,
    title: 'Gebruik maken van de ID-wallet?',
    description: 'De ID-wallet kan u helpen bij het regelen van zaken.',
    icon: Info,
    locked: true,
  },
];

const tabs: { id: TabId; label: string }[] = [
  { id: 'nog-te-doen', label: 'Nog te doen' },
  { id: 'gedaan', label: 'Gedaan' },
  { id: 'wat-doen-wij', label: 'Wat doen wij?' },
  { id: 'recht-op', label: 'Hier heeft u mogelijk recht op' },
];

export function StappenplanPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('nog-te-doen');
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [organization, setOrganization] = useState('alle');
  const [sort, setSort] = useState('spoed');

  const visibleSteps = useMemo(() => {
    if (activeTab === 'gedaan') {
      return allSteps.filter((step) => completedIds.has(step.id));
    }
    if (activeTab === 'wat-doen-wij') {
      return allSteps.filter((step) => step.locked);
    }
    if (activeTab === 'recht-op') {
      return allSteps.filter((step) => step.id >= 8);
    }
    return allSteps.filter((step) => !completedIds.has(step.id));
  }, [activeTab, completedIds]);

  const sortedSteps = useMemo(() => {
    const steps = [...visibleSteps];
    if (sort === 'spoed') {
      return steps.sort((a, b) => Number(a.locked) - Number(b.locked));
    }
    if (sort === 'naam') {
      return steps.sort((a, b) => a.title.localeCompare(b.title));
    }
    return steps;
  }, [visibleSteps, sort]);

  const filteredSteps = useMemo(() => {
    if (organization === 'alle') return sortedSteps;
    return sortedSteps.filter((step) => step.organization?.toLowerCase() === organization);
  }, [sortedSteps, organization]);

  const totalCount = allSteps.length;
  const doneCount = completedIds.size;
  const progress = Math.round((doneCount / totalCount) * 100);

  const completeStep = (id: number) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    setExpandedId(null);
  };

  const toggleExpanded = (id: number, locked?: boolean) => {
    if (locked) return;
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex gap-8 border-b border-gray-200 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-1 pb-3 pt-4 text-[15px] transition-colors ${
              activeTab === tab.id
                ? 'border-[#007AC8] font-semibold text-[#007AC8]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border-b border-gray-100 px-6 py-5">
        <div className="mb-4 flex flex-wrap gap-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-900">Organisatie</span>
            <select
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="min-w-[220px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="alle">Alle organisaties</option>
              <option value="gemeente">Gemeente</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-900">Sorteren</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="min-w-[220px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="spoed">Spoed (hoog - laag)</option>
              <option value="naam">Naam (A - Z)</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#007AC8] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-sm text-gray-600">
            {doneCount}/{totalCount} • {progress}%
          </span>
        </div>
      </div>

      {activeTab === 'nog-te-doen' && (
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Lock className="h-4 w-4" />
            Begin hier: eerst deze 2 taken afronden
          </div>
          <div className="flex flex-wrap gap-3">
            {[1, 2].map((id) => {
              const step = allSteps.find((item) => item.id === id);
              if (!step) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setExpandedId(id);
                    document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4" />
                  {step.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {filteredSteps.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-600">
            Geen taken in deze weergave.
          </div>
        ) : (
          filteredSteps.map((step) => {
            const Icon = step.icon;
            const isExpanded = expandedId === step.id;
            const isCompleted = completedIds.has(step.id);

            return (
              <div
                key={step.id}
                id={`step-${step.id}`}
                className={`${step.locked ? 'bg-gray-50/80' : 'bg-white'} ${
                  isExpanded ? 'border-l-4 border-l-[#007AC8]' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(step.id, step.locked)}
                  className={`flex w-full items-start gap-4 px-6 py-4 text-left ${
                    step.locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-gray-900">{step.title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{step.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-sm">
                    <span className={isCompleted ? 'text-green-700' : 'text-[#007AC8]'}>
                      {isCompleted ? 'Gedaan' : 'Nog te doen'}
                    </span>
                    {step.locked && (
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                        Vergrendeld
                      </span>
                    )}
                    {!step.locked &&
                      (isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ))}
                  </div>
                </button>

                {isExpanded && !step.locked && (
                  <div className="border-t border-gray-100 px-6 pb-5 pt-2">
                    <div className="mb-4 grid gap-4 sm:grid-cols-3">
                      {step.organization && (
                        <div>
                          <p className="text-xs text-gray-500">Organisatie</p>
                          <p className="text-sm font-semibold text-gray-900">{step.organization}</p>
                        </div>
                      )}
                      {step.posted && (
                        <div>
                          <p className="text-xs text-gray-500">Geplaatst</p>
                          <p className="text-sm font-semibold text-gray-900">{step.posted}</p>
                        </div>
                      )}
                      {step.deadline && (
                        <div>
                          <p className="text-xs text-gray-500">Wanneer geregeld hebben</p>
                          <p className="text-sm font-semibold text-gray-900">{step.deadline}</p>
                        </div>
                      )}
                    </div>
                    {step.detail && <p className="mb-4 text-sm text-gray-700">{step.detail}</p>}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="rounded-md bg-[#007AC8] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Aanvragen bij gemeente
                      </button>
                      <button
                        type="button"
                        onClick={() => completeStep(step.id)}
                        className="rounded-md border border-[#007AC8] bg-white px-5 py-2 text-sm font-semibold text-[#007AC8] hover:bg-[#DAEAF6]"
                      >
                        Taak afronden
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
