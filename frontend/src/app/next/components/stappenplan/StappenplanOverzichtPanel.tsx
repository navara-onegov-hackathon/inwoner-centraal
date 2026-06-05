import { CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OVERZICHT_REFERENCE_DATE } from '../../config/referenceDate';
import {
  buildStappenplanProgress,
  mapOverzichtToStappenplanTabs,
  type StappenplanRow as StappenplanRowModel,
  type StappenplanTabId,
} from '../../lib/mapOverzichtToStappenplanTabs';
import type { BegeleidingsVoorkeur } from '../../types/begeleiding';
import type { OverzichtResponse, StatusBoard } from '../../types/overzicht';
import { StappenplanRow } from './StappenplanRow';

interface StappenplanOverzichtPanelProps {
  partitioned: OverzichtResponse & { statusBoard: StatusBoard };
  isUitgebreid: boolean;
  voorkeur: BegeleidingsVoorkeur;
  onOverzichtChange: (next: OverzichtResponse | null) => void;
}

const tabs: { id: StappenplanTabId; label: string }[] = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'nog-te-doen', label: 'Nog te doen' },
  { id: 'gedaan', label: 'Gedaan' },
  { id: 'wat-doen-wij', label: 'Wat wij doen' },
];

export function StappenplanOverzichtPanel({
  partitioned,
  isUitgebreid,
  voorkeur,
  onOverzichtChange,
}: StappenplanOverzichtPanelProps) {
  const [activeTab, setActiveTab] = useState<StappenplanTabId>('urgent');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabRows = useMemo(
    () =>
      mapOverzichtToStappenplanTabs(
        partitioned.statusBoard,
        partitioned,
        isUitgebreid,
        OVERZICHT_REFERENCE_DATE,
      ),
    [partitioned, isUitgebreid],
  );

  const activeRows = tabRows[activeTab];

  const progress = useMemo(() => buildStappenplanProgress(tabRows), [tabRows]);

  const userTasksComplete =
    tabRows.urgent.length === 0 && tabRows['nog-te-doen'].length === 0;

  const toggleExpanded = (row: StappenplanRowModel) => {
    if (row.locked) return;
    setExpandedId((current) => (current === row.id ? null : row.id));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <section className="border-b border-gray-100 px-6 py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Algehele status
            </p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-gray-600">
              {progress.isComplete
                ? 'Alle stappen zijn afgerond. U bent klaar.'
                : progress.userTasksComplete
                  ? 'U hoeft op dit moment niets te doen. Wij houden het overige in de gaten.'
                  : 'Overzicht van hoe ver u bent met alle stappen.'}
            </p>
          </div>
          <p
            className={`text-4xl font-bold tabular-nums leading-none ${
              progress.isComplete ? 'text-green-600' : 'text-[#007AC8]'
            }`}
          >
            {progress.percentage}%
          </p>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuenow={progress.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Algehele status: ${progress.percentage}%`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress.isComplete ? 'bg-green-600' : 'bg-[#007AC8]'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">
            {progress.completedCount} van {progress.totalCount}
          </span>{' '}
          stappen afgerond
        </p>
      </section>

      <div className="flex gap-8 overflow-x-auto border-b border-gray-200 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setExpandedId(null);
            }}
            className={`shrink-0 border-b-2 px-1 pb-3 pt-4 text-[15px] transition-colors ${
              activeTab === tab.id
                ? 'border-[#007AC8] font-semibold text-[#007AC8]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-200">
        {activeRows.length === 0 ? (
          renderTabEmptyState({
            activeTab,
            userTasksComplete,
            hasNogTeDoenTasks: tabRows['nog-te-doen'].length > 0,
            onGoToNogTeDoen: () => {
              setActiveTab('nog-te-doen');
              setExpandedId(null);
            },
          })
        ) : (
          activeRows.map((row) => (
            <StappenplanRow
              key={row.id}
              row={row}
              overzicht={partitioned}
              voorkeur={voorkeur}
              isUitgebreid={isUitgebreid}
              onOverzichtChange={onOverzichtChange}
              expanded={expandedId === row.id}
              onToggle={() => toggleExpanded(row)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function renderTabEmptyState({
  activeTab,
  userTasksComplete,
  hasNogTeDoenTasks,
  onGoToNogTeDoen,
}: {
  activeTab: StappenplanTabId;
  userTasksComplete: boolean;
  hasNogTeDoenTasks: boolean;
  onGoToNogTeDoen: () => void;
}) {
  if (activeTab === 'urgent') {
    if (userTasksComplete) {
      return <UserTasksCompleteMessage />;
    }
    if (hasNogTeDoenTasks) {
      return <NoUrgentTasksMessage onGoToNogTeDoen={onGoToNogTeDoen} />;
    }
  }

  if (activeTab === 'nog-te-doen' && userTasksComplete) {
    return <UserTasksCompleteMessage />;
  }

  return (
    <div className="px-6 py-10 text-center text-sm text-gray-600">
      Geen taken in deze weergave.
    </div>
  );
}

function UserTasksCompleteMessage() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden />
      </div>
      <h3 className="text-lg font-bold text-gray-900">U hoeft op dit moment niets te doen</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
        Alle taken voor u zijn afgerond. Komt er weer iets op uw naam te staan, dan ziet u dat
        hier terug.
      </p>
    </div>
  );
}

function NoUrgentTasksMessage({ onGoToNogTeDoen }: { onGoToNogTeDoen: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden />
      </div>
      <h3 className="text-lg font-bold text-gray-900">U hoeft nu niets urgent te doen</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
        Er is op dit moment niets dat direct uw aandacht vraagt. U kunt rustig verder wanneer het
        u uitkomt. Overige open stappen vindt u onder{' '}
        <button
          type="button"
          onClick={onGoToNogTeDoen}
          className="font-semibold text-[#007AC8] underline-offset-2 hover:underline"
        >
          Nog te doen
        </button>
        .
      </p>
    </div>
  );
}
