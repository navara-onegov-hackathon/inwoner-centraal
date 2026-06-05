import type { Taak } from '../../types/overzicht';
import { TaakRow } from './TaakRow';

interface NogTeDoenSectionProps {
  taken: Taak[];
  onOpenTaak: (id: string) => void;
}

export function NogTeDoenSection({ taken, onOpenTaak }: NogTeDoenSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-bold text-gray-900">In behandeling</h2>
      {taken.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white px-5 py-6 text-sm text-gray-600">
          Er zijn op dit moment geen openstaande taken. Dat is goed nieuws.
        </p>
      ) : (
        <div className="space-y-3">
          {taken.map((taak) => (
            <TaakRow key={taak.id} taak={taak} onOpen={onOpenTaak} />
          ))}
        </div>
      )}
    </section>
  );
}
