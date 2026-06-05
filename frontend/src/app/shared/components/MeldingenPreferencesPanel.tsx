import { GovernmentToggle } from '../../legacy/components/GovernmentToggle';
import type { MeldingenVoorkeur } from '../../next/types/begeleiding';

interface MeldingenPreferencesPanelProps {
  voorkeur: MeldingenVoorkeur;
  onChange: (next: MeldingenVoorkeur) => void;
  showGovernmentSection?: boolean;
}

export function MeldingenPreferencesPanel({
  voorkeur,
  onChange,
  showGovernmentSection = true,
}: MeldingenPreferencesPanelProps) {
  const toggle = (key: keyof MeldingenVoorkeur) => {
    onChange({ ...voorkeur, [key]: !voorkeur[key] });
  };

  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-gray-800">
      {showGovernmentSection && (
        <section>
          <h2 className="mb-2 text-base font-bold text-gray-900">Ondersteuning vanuit de overheid</h2>
          <p className="mb-4 text-sm text-gray-600">
            Organisaties kunnen u gerichter ondersteunen als u toestemming geeft om gegevens te delen
            en suggesties te ontvangen.
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <GovernmentToggle
                checked={voorkeur.governmentSupport}
                onChange={() => toggle('governmentSupport')}
              />
              <span className="text-sm">
                een overzicht te sturen van zaken die nog geregeld moeten worden
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GovernmentToggle
                checked={voorkeur.suggestions}
                onChange={() => toggle('suggestions')}
              />
              <span className="text-sm">
                suggesties te doen welke instanties op de hoogte gebracht kunnen worden
              </span>
            </div>
          </div>
        </section>
      )}

      <section className={showGovernmentSection ? 'border-t border-gray-100 pt-6' : undefined}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <GovernmentToggle
              checked={voorkeur.emailSteps}
              onChange={() => toggle('emailSteps')}
            />
            <span className="text-sm">Een e-mail als u iets moet doen</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <GovernmentToggle
              checked={voorkeur.emailNotifications}
              onChange={() => toggle('emailNotifications')}
            />
            <span className="text-sm">Een e-mail met nieuws over uw situatie</span>
          </div>
        </div>
      </section>
    </div>
  );
}
