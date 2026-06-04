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
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#007AC8]">
          Welkom, {persona.nabestaande.split(' ')[0]}
        </p>
        <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900">
          We leven met u mee
        </h1>
        <div className="space-y-4 text-base leading-relaxed text-gray-700">
          <p>
            {voornaam} is overleden op {formatted}. Dit is een zware periode — administratieve
            zaken kunnen nu extra belastend voelen.
          </p>
          <p>
            Wij helpen u zien wat de overheid regelt, wat nog aandacht vraagt, en wat op de
            achtergrond al voor u wordt gedaan. U hoeft niet alles tegelijk te overzien.
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
