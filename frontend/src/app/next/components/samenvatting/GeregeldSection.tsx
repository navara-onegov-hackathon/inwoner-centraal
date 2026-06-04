import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Agentstap, Regeling } from '../../types/overzicht';

interface GeregeldSectionProps {
  regelingen: Regeling[];
  agentstappen: Agentstap[];
  isUitgebreid: boolean;
}

export function GeregeldSection({ regelingen, agentstappen, isUitgebreid }: GeregeldSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-lg font-bold text-gray-900">Geregeld voor u</h2>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-6 border-t border-gray-100 px-5 py-5">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Al geregeld
            </h3>
            <ul className="space-y-3">
              {regelingen.map((r) => (
                <li key={r.id} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {r.organisatie} — {r.titel}
                    </p>
                    {(isUitgebreid || r.toelichting.length < 80) && (
                      <p className="text-sm text-gray-600">{r.toelichting}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Recent gedaan door ons
            </h3>
            <ul className="space-y-3">
              {agentstappen.map((s) => (
                <li key={s.id} className="flex gap-3 text-sm">
                  <span className="mt-0.5 text-[#007AC8]">→</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {s.organisatie} — {s.omschrijving}
                    </p>
                    {isUitgebreid && (
                      <p className="text-gray-500">{formatDate(s.uitgevoerd_op)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
