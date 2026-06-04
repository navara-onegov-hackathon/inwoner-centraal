import type { PersonaContext } from '../../../types/overzicht';
import type { PostadresKeuze } from '../../../types/begeleiding';

interface PostadresStepProps {
  persona: PersonaContext;
  keuze: PostadresKeuze;
  onChange: (k: PostadresKeuze) => void;
  onNext: () => void;
  onBack: () => void;
}

const OPTIONS: { value: PostadresKeuze; title: string; description: string }[] = [
  {
    value: 'thuisadres',
    title: 'Post naar mijn thuisadres',
    description:
      'Wij geven uw woonadres door aan organisaties die nog naar het zorgcentrum schrijven.',
  },
  {
    value: 'huidige_situatie',
    title: 'Laat het voorlopig zo',
    description: 'Geen wijziging nu. U kunt dit later aanpassen bij Gegevens aanvullen.',
  },
  {
    value: 'later',
    title: 'Beslis ik later',
    description: 'We tonen een herinnering op uw overzicht.',
  },
];

export function PostadresStep({ keuze, onChange, onNext, onBack }: PostadresStepProps) {
  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Waar wilt u post ontvangen?</h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Sommige organisaties sturen nog post naar het adres van Cees (Zorgcentrum De Wilg). Dat
          kan verwarrend zijn. Kies wat voor u het beste werkt.
        </p>

        <div className="space-y-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                keuze === opt.value
                  ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{opt.title}</p>
              <p className="mt-1 text-sm text-gray-600">{opt.description}</p>
            </button>
          ))}
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
