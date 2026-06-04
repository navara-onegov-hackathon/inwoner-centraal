import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { DataCorrectionBlock } from '../../../shared/components/DataCorrectionBlock';
import { applyPartitionToOverzicht } from '../../lib/partitionOverzicht';
import type { BegeleidingsVoorkeur } from '../../types/begeleiding';
import { useDetailniveau } from '../../hooks/useDetailniveau';
import { useOverzicht } from '../../hooks/useOverzicht';
import { StappenplanOverzichtPanel } from '../stappenplan/StappenplanOverzichtPanel';

interface OverzichtPageProps {
  voorkeur: BegeleidingsVoorkeur;
}

export function OverzichtPage({ voorkeur }: OverzichtPageProps) {
  const { data, error, loading } = useOverzicht();
  const { isUitgebreid } = useDetailniveau();

  const partitioned = useMemo(
    () => (data ? applyPartitionToOverzicht(data, voorkeur) : null),
    [data, voorkeur],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#007AC8]">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Laden..." />
      </div>
    );
  }

  if (error || !partitioned) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-900">
          {error ?? 'Overzicht kon niet worden geladen.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <span className="text-gray-600">Home</span>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-800">Mijn situatie</span>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold text-gray-900">Nabestaande</span>
      </nav>

      <h1 className="mb-8 text-[2rem] font-bold leading-tight text-gray-900">Stappenplan</h1>

      <DataCorrectionBlock />

      <StappenplanOverzichtPanel partitioned={partitioned} isUitgebreid={isUitgebreid} />
    </div>
  );
}
