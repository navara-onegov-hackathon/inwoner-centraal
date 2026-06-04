import { AlertTriangle } from 'lucide-react';
import type { PersonaContext } from '../../types/overzicht';

export function PostadresAlert({ persona }: { persona: PersonaContext }) {
  if (!persona.postadres_alert) return null;

  const scrollToCorrection = () => {
    document.getElementById('gegevens-aanvullen')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="mb-8 flex gap-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-amber-950">{persona.postadres_alert}</p>
        {persona.postadres_cta_label && (
          <button
            type="button"
            onClick={scrollToCorrection}
            className="mt-3 text-sm font-semibold text-[#007AC8] underline-offset-2 hover:underline"
          >
            {persona.postadres_cta_label}
          </button>
        )}
      </div>
    </section>
  );
}
