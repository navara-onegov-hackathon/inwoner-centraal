import { CheckCircle2, FileText, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  buildStappenplanProgress,
  mapOverzichtToStappenplanTabs,
  pickUrgentRowIds,
  type StappenplanRow as StappenplanRowModel,
  type StappenplanTabId,
} from '../../lib/mapOverzichtToStappenplanTabs';
import type { OverzichtResponse, StatusBoard } from '../../types/overzicht';
import { StappenplanRow } from './StappenplanRow';

interface StappenplanOverzichtPanelProps {
  partitioned: OverzichtResponse & { statusBoard: StatusBoard };
  isUitgebreid: boolean;
  onOverzichtChange: (next: OverzichtResponse | null) => void;
}

const tabs: { id: StappenplanTabId; label: string }[] = [
  { id: 'nog-te-doen', label: 'Nog te doen' },
  { id: 'gedaan', label: 'Gedaan' },
  { id: 'wat-doen-wij', label: 'Wat doen wij?' },
  { id: 'recht-op', label: 'Hier heeft u mogelijk recht op' },
];

export function StappenplanOverzichtPanel({
  partitioned,
  isUitgebreid,
  onOverzichtChange,
}: StappenplanOverzichtPanelProps) {
  const [activeTab, setActiveTab] = useState<StappenplanTabId>('nog-te-doen');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [organization, setOrganization] = useState('alle');
  const [sort, setSort] = useState('spoed');

  const tabRows = useMemo(
    () => mapOverzichtToStappenplanTabs(partitioned.statusBoard, partitioned, isUitgebreid),
    [partitioned, isUitgebreid],
  );

  const activeRows = tabRows[activeTab];

  const organisations = useMemo(() => {
    const orgs = new Set(activeRows.map((r) => r.organisatie));
    return Array.from(orgs).sort((a, b) => a.localeCompare(b));
  }, [activeRows]);

  const sortedRows = useMemo(() => sortRows(activeRows, sort), [activeRows, sort]);

  const filteredRows = useMemo(() => {
    if (organization === 'alle') return sortedRows;
    return sortedRows.filter((r) => r.organisatie.toLowerCase() === organization);
  }, [sortedRows, organization]);

  const progress = useMemo(() => buildStappenplanProgress(tabRows), [tabRows]);

  const urgentIds = useMemo(
    () => new Set(pickUrgentRowIds(tabRows['nog-te-doen'])),
    [tabRows],
  );

  const toggleExpanded = (row: StappenplanRowModel) => {
    if (row.locked) return;
    setExpandedId((current) => (current === row.id ? null : row.id));
  };

  const scrollToRow = (id: string) => {
    setExpandedId(id);
    document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
              setOrganization('alle');
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

      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex flex-wrap gap-6">
          <label className="flex flex-col gap-1 text-sm">
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
      </div>

      {activeTab === 'nog-te-doen' && urgentIds.size > 0 && (
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Lock className="h-4 w-4" aria-hidden />
            Begin hier: eerst deze {urgentIds.size === 1 ? 'taak' : 'taken'} afronden
          </div>
          <div className="flex flex-wrap gap-3">
            {tabRows['nog-te-doen']
              .filter((r) => urgentIds.has(r.id))
              .map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => scrollToRow(row.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  {row.title}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {filteredRows.length === 0 ? (
          activeTab === 'nog-te-doen' &&
          tabRows['nog-te-doen'].length === 0 &&
          organization === 'alle' ? (
            <UserTasksCompleteMessage />
          ) : (
            <div className="px-6 py-10 text-center text-sm text-gray-600">
              Geen taken in deze weergave.
            </div>
          )
        ) : (
          filteredRows.map((row) => (
            <StappenplanRow
              key={row.id}
              row={row}
              overzicht={partitioned}
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

function sortRows(rows: StappenplanRowModel[], sort: string): StappenplanRowModel[] {
  const copy = [...rows];
  if (sort === 'spoed') {
    return copy.sort((a, b) => {
      const lockedDiff = Number(a.locked) - Number(b.locked);
      if (lockedDiff !== 0) return lockedDiff;
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  }
  if (sort === 'naam') {
    return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  return copy;
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
