import type { MeldingenVoorkeur } from '../../../types/begeleiding';
import { MeldingenPreferencesPanel } from '../../../../shared/components/MeldingenPreferencesPanel';

interface MeldingenStepProps {
  voorkeur: MeldingenVoorkeur;
  onChange: (v: MeldingenVoorkeur) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MeldingenStep({ voorkeur, onChange, onNext, onBack }: MeldingenStepProps) {
  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Welke meldingen wilt u ontvangen?</h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Kies hoe wij u op de hoogte houden. U kunt dit later altijd wijzigen via Instellingen.
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <MeldingenPreferencesPanel voorkeur={voorkeur} onChange={onChange} />
        </div>
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
          onClick={onNext}
          className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD]"
        >
          Verder
        </button>
      </div>
    </>
  );
}
