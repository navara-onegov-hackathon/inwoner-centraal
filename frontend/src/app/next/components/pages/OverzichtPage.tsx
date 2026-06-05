import { Loader2, Printer } from 'lucide-react';
import { useMemo } from 'react';
import { applyPartitionToOverzicht } from '../../lib/partitionOverzicht';
import type { BegeleidingsVoorkeur } from '../../types/begeleiding';
import { useDetailniveau } from '../../hooks/useDetailniveau';
import { useOverzicht } from '../../hooks/useOverzicht';
import { StappenplanOverzichtPanel } from '../stappenplan/StappenplanOverzichtPanel';

interface OverzichtPageProps {
  voorkeur: BegeleidingsVoorkeur;
  onNavigate?: (section: string) => void;
}

export function OverzichtPage({ voorkeur, onNavigate }: OverzichtPageProps) {
  const { data, error, loading, setData } = useOverzicht();
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
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          className="hover:text-[#007AC8] hover:underline"
        >
          Overzicht
        </button>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold text-gray-900">Stappenplan</span>
      </nav>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[2rem] font-bold leading-tight text-gray-900">Stappenplan</h1>
        <button
          type="button"
          onClick={() => alert('Nog te implementeren')}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Afdrukken
        </button>
      </div>

      <StappenplanOverzichtPanel
        partitioned={partitioned}
        isUitgebreid={isUitgebreid}
        voorkeur={voorkeur}
        onOverzichtChange={setData}
      />
    </div>
  );
}
