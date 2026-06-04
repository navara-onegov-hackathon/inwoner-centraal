import type { PersonaContext } from '../../types/overzicht';

export function CondoleanceBanner({ persona }: { persona: PersonaContext }) {
  const formatted = new Date(persona.overlijdensdatum).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const voornaamOverledene = persona.overledene.split(' ')[0];

  return (
    <section className="mb-8 rounded-lg border border-[#DAEAF6] bg-[#E8F4FC] px-6 py-5">
      <p className="text-base leading-relaxed text-gray-900">
        We leven met u mee. {voornaamOverledene} is overleden op {formatted}.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        We hebben voor u samengebracht wat de overheid nu regelt. U hoeft niet zelf te zoeken — wij
        tonen wat al geregeld is en waar uw hulp nodig is.
      </p>
    </section>
  );
}
