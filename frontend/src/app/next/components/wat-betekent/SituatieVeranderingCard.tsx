import { ArrowRight } from 'lucide-react';
import type { SituatieVerandering } from '../../data/situatieVeranderingen';

interface SituatieVeranderingCardProps {
  item: SituatieVerandering;
}

export function SituatieVeranderingCard({ item }: SituatieVeranderingCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
            {item.organisatie}
          </span>
        </div>
        <h2 className="mt-2 text-base font-bold text-gray-900">{item.titel}</h2>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 md:border-b-0 md:border-r">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Vóór
          </p>
          <p className="text-sm leading-relaxed text-gray-700">{item.voor}</p>
        </div>

        <div className="hidden items-center justify-center px-3 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F4FC] text-[#007AC8]">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 md:border-t-0 md:border-l">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#007AC8]">
            Na / vanaf nu
          </p>
          <p className="text-sm leading-relaxed text-gray-800">{item.na}</p>
        </div>
      </div>

      {item.toelichting && (
        <div className="border-t border-gray-100 bg-[#E8F4FC]/30 px-5 py-3">
          <p className="text-sm leading-relaxed text-gray-600">{item.toelichting}</p>
        </div>
      )}
    </article>
  );
}
