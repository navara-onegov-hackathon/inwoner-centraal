import { useState } from 'react';
import { GovernmentToggle } from './GovernmentToggle';
import { StappenplanPanel } from './StappenplanPanel';

interface MijnSituatieProps {
  onNavigate?: (section: string) => void;
}

export function MijnSituatie({ onNavigate }: MijnSituatieProps) {
  const [settings, setSettings] = useState({
    governmentSupport: true,
    suggestions: true,
    emailSteps: true,
    emailNotifications: false,
    inAppNotifications: false,
  });
  const [helpRequested, setHelpRequested] = useState(false);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate?.('home')} className="hover:text-[#007AC8] hover:underline">
          Home
        </button>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-800">Mijn situatie</span>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold text-gray-900">Nabestaande</span>
      </nav>

      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-[2rem] font-bold leading-tight text-gray-900">Informatie</h1>
        <button
          type="button"
          onClick={() => setHelpRequested(true)}
          className="shrink-0 rounded-md bg-[#007AC8] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Ik heb hulp nodig
        </button>
      </div>

      {helpRequested && (
        <div className="mb-6 rounded-md border border-[#007AC8]/30 bg-[#E8F4FC] px-4 py-3 text-sm text-gray-800">
          Uw hulpverzoek is geregistreerd. Een medewerker neemt binnen 2 werkdagen contact met u op.
        </div>
      )}

      <div className="mb-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-6 text-[15px] leading-relaxed text-gray-800">
          <section>
            <h2 className="mb-2 text-base font-bold text-gray-900">Gecondoleerd</h2>
            <p>
              De gemeente heeft aangegeven dat u nabestaande bent. Gecondoleerd met uw verlies.
            </p>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Uitstel van verplichtingen</h2>
            <p>
              Dit kan een moeilijke tijd zijn voor u en uw dierbaren. Daarom kunt u in de eerste drie
              maanden na het overlijden van uw naaste niet verplicht met uw situatie aan de slag.
            </p>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Heeft u hulp nodig?</h2>
            <p>
              Klik op de knop &quot;Ik heb hulp nodig&quot; bovenaan de pagina voor ondersteuning en
              persoonlijk contact.
            </p>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">Ondersteuning vanuit de overheid</h2>
            <p className="mb-4">
              Om u te helpen hebben organisaties van de overheid gegevens voor uw stappenplan
              klaarstaan. Deze vindt u onderaan de pagina. Geef toestemming om gegevens te delen
              zodat wij u gerichter kunnen ondersteunen.
            </p>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <GovernmentToggle
                checked={settings.governmentSupport}
                onChange={() => toggleSetting('governmentSupport')}
              />
              <span>een overzicht te sturen van zaken die nog geregeld moeten worden</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <GovernmentToggle
                checked={settings.suggestions}
                onChange={() => toggleSetting('suggestions')}
              />
              <span>suggesties te doen welke instanties op de hoogte gebracht kunnen worden</span>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">Meldingen ontvangen</h2>
            <p className="mb-4">
              U kiest zelf welke meldingen u ontvangt. Zet een schakelaar op AAN om meldingen te
              ontvangen, of op UIT om ze uit te zetten.
            </p>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <GovernmentToggle
                  checked={settings.emailSteps}
                  onChange={() => toggleSetting('emailSteps')}
                />
                <span>E-mails bij belangrijke stappen of herinneringen</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <GovernmentToggle
                  checked={settings.emailNotifications}
                  onChange={() => toggleSetting('emailNotifications')}
                />
                <span>E-mailnotificaties over uw situatie</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <GovernmentToggle
                  checked={settings.inAppNotifications}
                  onChange={() => toggleSetting('inAppNotifications')}
                />
                <span>Notificaties in MijnOverheid</span>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Gebruik maken van de ID-wallet?</h2>
            <p>
              De ID-wallet kan u helpen met het regelen van zaken. Lees hier meer over uw ID-wallet
              en welke documenten u daarmee kunt delen.
            </p>
          </section>
        </div>
      </div>

      <h2 className="mb-6 text-[2rem] font-bold leading-tight text-gray-900">Stappenplan</h2>
      <StappenplanPanel />
    </div>
  );
}
