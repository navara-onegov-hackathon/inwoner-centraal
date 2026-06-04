import type { PersonaContext } from '../../../types/overzicht';

interface CondoleanceStepProps {
  persona: PersonaContext;
  onNext: () => void;
}

export function CondoleanceStep({ persona, onNext }: CondoleanceStepProps) {
  const formatted = new Date(persona.overlijdensdatum).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const voornaam = persona.overledene.split(' ')[0];

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900">
          We leven met u mee, {persona.nabestaande.split(' ')[0]}
        </h1>
        <div className="space-y-4 text-base leading-relaxed text-gray-700">
          <p>
            {voornaam} is op {formatted} overleden. Wij weten dat er nu veel op u afkomt.
          </p>
          <p>
            Wij laten u zien wat de overheid regelt, en wat u nog moet doen. U hoeft niet alles in één keer te doen.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="mt-8 w-full rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD]"
      >
        Verder
      </button>
    </>
  );
}
