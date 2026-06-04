import {
  Car,
  ChevronDown,
  ChevronUp,
  FileText,
  Landmark,
  Shield,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { StappenplanRow as StappenplanRowModel } from '../../lib/mapOverzichtToStappenplanTabs';
import type { OverzichtResponse, Taak } from '../../types/overzicht';

interface StappenplanRowProps {
  row: StappenplanRowModel;
  overzicht: OverzichtResponse;
  isUitgebreid: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function StappenplanRow({
  row,
  overzicht,
  isUitgebreid,
  expanded,
  onToggle,
}: StappenplanRowProps) {
  const Icon = getOrgIcon(row.organisatie);
  const canExpand = !row.locked;
  const taak = row.taakId ? overzicht.taken.find((t) => t.id === row.taakId) : undefined;

  const statusLabel = row.completed ? 'Gedaan' : 'Nog te doen';

  return (
    <div
      id={`step-${row.id}`}
      className={`${row.locked ? 'bg-gray-50/80' : 'bg-white'} ${
        expanded ? 'border-l-4 border-l-[#007AC8]' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => canExpand && onToggle()}
        className={`flex w-full items-start gap-4 px-6 py-4 text-left ${
          row.locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
        }`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900">{row.title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{row.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <span className={row.completed ? 'text-green-700' : 'text-[#007AC8]'}>{statusLabel}</span>
          {row.locked && (
            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
              Vergrendeld
            </span>
          )}
          {canExpand &&
            (expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
            ))}
        </div>
      </button>

      {expanded && canExpand && (
        <div className="border-t border-gray-100 px-6 pb-5 pt-2">
          {taak ? (
            <TaakExpandedDetail taak={taak} overzicht={overzicht} isUitgebreid={isUitgebreid} />
          ) : (
            <NonTaakExpandedDetail row={row} />
          )}
        </div>
      )}
    </div>
  );
}

function TaakExpandedDetail({
  taak,
  overzicht,
  isUitgebreid,
}: {
  taak: Taak;
  overzicht: OverzichtResponse;
  isUitgebreid: boolean;
}) {
  const brieven = overzicht.correspondentie.filter((b) => taak.bron_brief_ids.includes(b.id));
  const verplichtingen = overzicht.verplichtingen.filter((v) =>
    taak.bron_verplichting_ids.includes(v.id),
  );
  const agentstappen = overzicht.agentstappen.filter((s) => s.organisatie === taak.organisatie);

  return (
    <div className="space-y-4">
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Organisatie</p>
          <p className="text-sm font-semibold text-gray-900">{taak.organisatie}</p>
        </div>
        {taak.deadline && (
          <div>
            <p className="text-xs text-gray-500">Wanneer geregeld hebben</p>
            <p className="text-sm font-semibold text-gray-900">{formatDeadline(taak.deadline)}</p>
          </div>
        )}
        {taak.bedrag && (
          <div>
            <p className="text-xs text-gray-500">Bedrag</p>
            <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-800">
              € {formatBedrag(taak.bedrag.bedrag)}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed text-gray-700">{taak.samenvatting}</p>

      {agentstappen.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Wat wij al deden</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {agentstappen.map((s) => (
              <li key={s.id}>→ {s.omschrijving}</li>
            ))}
          </ul>
        </div>
      )}

      {taak.toon_cta_in_lijst && taak.cta_label && (
        <button
          type="button"
          className="rounded-md bg-[#007AC8] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {taak.cta_label}
        </button>
      )}

      {isUitgebreid && (brieven.length > 0 || verplichtingen.length > 0) && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Onderliggende gegevens</h3>

          {brieven.map((b) => (
            <div key={b.id} className="rounded-md bg-gray-50 p-3 text-sm">
              <p className="font-semibold">Brief — {b.type}</p>
              <p className="text-gray-600">{b.aanhef}</p>
              <p className="mt-1 text-gray-500">Verzonden: {b.verzonden_op}</p>
              {b.actie_omschrijving && <p className="mt-1">{b.actie_omschrijving}</p>}
            </div>
          ))}

          {verplichtingen.map((v) => (
            <div key={v.id} className="rounded-md bg-gray-50 p-3 text-sm">
              <p className="font-semibold">Verplichting</p>
              <p>{v.omschrijving}</p>
              {v.bedrag && <p className="mt-1">€ {v.bedrag.bedrag}</p>}
              <p className="text-gray-500">Vervaldatum: {v.vervaldatum}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NonTaakExpandedDetail({ row }: { row: StappenplanRowModel }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500">Organisatie</p>
        <p className="text-sm font-semibold text-gray-900">{row.organisatie}</p>
      </div>
      <p className="text-sm leading-relaxed text-gray-700">{row.description}</p>
    </div>
  );
}

function getOrgIcon(organisatie: string): LucideIcon {
  switch (organisatie) {
    case 'Gemeente':
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

function formatBedrag(value: string) {
  return Number(value).toLocaleString('nl-NL', { minimumFractionDigits: 0 });
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
