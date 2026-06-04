import { Check } from 'lucide-react';
import type { BegeleidingsVoorkeur, Begeleidingsniveau } from '../../../types/begeleiding';

interface BegeleidingStepProps {
  voorkeur: BegeleidingsVoorkeur;
  onChange: (v: BegeleidingsVoorkeur) => void;
  onNext: () => void;
  onBack: () => void;
}

const OPTIONS: {
  niveau: Begeleidingsniveau;
  title: string;
  summary: string;
  bullets: string[];
  hint: string;
}[] = [
  {
    niveau: 'maximaal',
    title: 'Regel zoveel mogelijk voor mij',
    summary: 'Wij bereiden voor, schakelen met organisaties en houden u kort op de hoogte.',
    bullets: [
      'Minste aantal handelingen voor u',
      'U betaalt, tekent of bevestigt alleen waar dat moet',
      'Korte updates over wat wij doen',
    ],
    hint: 'Geschikt als u overzicht wilt zonder zelf te zoeken.',
  },
  {
    niveau: 'zelf',
    title: 'Ik regel het liever zelf',
    summary: 'U ziet alles en voert stappen zelf uit. Wij tonen vooral informatie.',
    bullets: [
      'Alle taken en brieven zichtbaar',
      'Geen automatische acties op de achtergrond',
      'Meer controle, meer lezen',
    ],
    hint: 'Geschikt als u elk detail zelf wilt beoordelen.',
  },
  {
    niveau: 'keuze',
    title: 'Ik kies per taak',
    summary: 'Bepaal per taak of u het zelf regelt of hulp wilt.',
    bullets: [
      'Per taak kiezen wat bij u past',
      'Geen automatische acties op de achtergrond',
      'Meer controle, taak voor taak',
    ],
    hint: 'Geschikt als u sommige stappen zelf wilt, andere niet.',
  },
];

export function BegeleidingStep({ voorkeur, onChange, onNext, onBack }: BegeleidingStepProps) {
  const select = (niveau: Begeleidingsniveau) => {
    onChange({ niveau, zelfRegelenOrganisaties: [] });
  };

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Hoeveel mag wij voor u doen?</h1>
        <p className="mb-6 text-sm text-gray-600">
          U kunt dit later altijd wijzigen via <strong>Instellingen</strong> in het menu.
        </p>

        <div className="space-y-3">
          {OPTIONS.map((opt) => {
            const selected = voorkeur.niveau === opt.niveau;
            return (
              <button
                key={opt.niveau}
                type="button"
                onClick={() => select(opt.niveau)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selected
                    ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{opt.title}</p>
                    <p className="mt-1 text-sm text-gray-700">{opt.summary}</p>
                  </div>
                  {selected && <Check className="h-5 w-5 shrink-0 text-[#007AC8]" />}
                </div>
                {selected && (
                  <ul className="mt-3 space-y-1 border-t border-[#DAEAF6] pt-3 text-sm text-gray-600">
                    {opt.bullets.map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                    <li className="mt-2 italic text-gray-500">{opt.hint}</li>
                  </ul>
                )}
              </button>
            );
          })}
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
