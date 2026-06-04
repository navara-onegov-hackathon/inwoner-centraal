import { ChevronDown, Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface StatusLaneProps {
  id: string;
  title: string;
  description: string;
  count: number;
  defaultOpen?: boolean;
  accentClass?: string;
  children: ReactNode;
  emptyMessage?: string;
}

export function StatusLane({
  id,
  title,
  description,
  count,
  defaultOpen = true,
  accentClass = 'border-gray-200',
  children,
  emptyMessage = 'Niets in deze categorie op dit moment.',
}: StatusLaneProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className={`mb-6 overflow-hidden rounded-lg border bg-white shadow-sm ${accentClass}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {count}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {count === 0 ? (
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
}

export function BackgroundActivityItem({
  organisatie,
  omschrijving,
}: {
  organisatie: string;
  omschrijving: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-blue-100 bg-blue-50/50 px-4 py-3">
      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#007AC8]" aria-hidden />
      <div>
        <p className="text-xs font-semibold uppercase text-[#007AC8]">{organisatie}</p>
        <p className="text-sm text-gray-800">{omschrijving}</p>
      </div>
    </div>
  );
}
