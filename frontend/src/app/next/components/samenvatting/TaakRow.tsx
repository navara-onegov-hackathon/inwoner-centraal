import type { Taak } from '../../types/overzicht';

interface TaakRowProps {
  taak: Taak;
  onOpen: (id: string) => void;
}

export function TaakRow({ taak, onOpen }: TaakRowProps) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#007AC8]/40">
      <button type="button" onClick={() => onOpen(taak.id)} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#007AC8]">
              {taak.organisatie}
            </p>
            <h3 className="mt-1 text-base font-bold text-gray-900">{taak.titel}</h3>
            <p className="mt-1 text-sm text-gray-600">{taak.samenvatting}</p>
          </div>
          <StatusChip status={taak.status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {taak.bedrag && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-800">
              € {formatBedrag(taak.bedrag.bedrag)}
            </span>
          )}
          {taak.deadline && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-sm text-amber-900">
              Vervalt {formatDate(taak.deadline)}
            </span>
          )}
        </div>
      </button>

      {taak.toon_cta_in_lijst && taak.cta_label && (
        <button
          type="button"
          onClick={() => onOpen(taak.id)}
          className="mt-4 rounded-md bg-[#007AC8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0069AD]"
        >
          {taak.cta_label}
        </button>
      )}
    </article>
  );
}

function StatusChip({ status }: { status: Taak['status'] }) {
  const label =
    status === 'actie_nodig' ? 'Actie nodig' : status === 'wacht_op_u' ? 'Wacht op u' : 'In behandeling';
  const colors =
    status === 'actie_nodig'
      ? 'bg-red-50 text-red-800'
      : status === 'wacht_op_u'
        ? 'bg-blue-50 text-blue-800'
        : 'bg-gray-100 text-gray-700';

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}>
      {label}
    </span>
  );
}

function formatBedrag(value: string) {
  return Number(value).toLocaleString('nl-NL', { minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  });
}
