import type { GegevensProfiel } from '../../../types/begeleiding';
import { formatAdres } from '../../../types/begeleiding';
import {
  AdresGegevensCard,
  BsnGegevensCard,
  IbanGegevensCard,
  NaamGegevensCard,
} from '../SecureGegevensCard';

interface VerifyGegevensStepProps {
  gegevens: GegevensProfiel;
  onChange: (g: GegevensProfiel) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function VerifyGegevensStep({
  gegevens,
  onChange,
  onComplete,
  onBack,
}: VerifyGegevensStepProps) {
  const patch = (partial: Partial<GegevensProfiel>) => onChange({ ...gegevens, ...partial });

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Klopt uw informatie?</h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Uw gegevens zijn standaard afgeschermd. Klik op <strong>Bewerken</strong> om een onderdeel
          te wijzigen. Zo voorkomt u onbedoelde aanpassingen.
        </p>

        <div className="space-y-4">
          <NaamGegevensCard
            value={gegevens.volledigeNaam}
            onChange={(volledigeNaam) => patch({ volledigeNaam })}
          />
          <AdresGegevensCard
            value={gegevens.adres}
            onChange={(adres) => patch({ adres })}
          />
          <BsnGegevensCard value={gegevens.bsn} onChange={(bsn) => patch({ bsn })} />
          <IbanGegevensCard value={gegevens.iban} onChange={(iban) => patch({ iban })} />
        </div>

        <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
          Volledig adres: {formatAdres(gegevens.adres)}
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-md border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Terug
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD]"
        >
          Naar uw overzicht
        </button>
      </div>
    </>
  );
}
