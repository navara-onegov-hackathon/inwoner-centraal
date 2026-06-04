import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { GovernmentToggle } from '../../legacy/components/GovernmentToggle';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../legacy/components/ui/sheet';
import {
  BEGELEIDING_LABELS,
  DELEGATIE_ORGANISATIES,
  type BegeleidingsVoorkeur,
  type Begeleidingsniveau,
} from '../../next/types/begeleiding';

interface InstellingenMenuProps {
  voorkeur: BegeleidingsVoorkeur;
  onChange: (v: BegeleidingsVoorkeur) => void;
  onResetOnboarding?: () => void;
}

export function InstellingenMenu({ voorkeur, onChange, onResetOnboarding }: InstellingenMenuProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    governmentSupport: true,
    suggestions: true,
    emailSteps: true,
    emailNotifications: false,
    inAppNotifications: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setNiveau = (niveau: Begeleidingsniveau) => {
    onChange({
      niveau,
      zelfRegelenOrganisaties: niveau === 'keuze' ? voorkeur.zelfRegelenOrganisaties : [],
    });
  };

  const toggleOrg = (org: string) => {
    const set = new Set(voorkeur.zelfRegelenOrganisaties);
    if (set.has(org)) set.delete(org);
    else set.add(org);
    onChange({ niveau: 'keuze', zelfRegelenOrganisaties: [...set] });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:border-[#007AC8]/40"
      >
        Instellingen
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Instellingen</SheetTitle>
            <SheetDescription>
              Begeleiding, meldingen en overige voorkeuren voor uw stappenplan.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8 px-4 pb-6 text-[15px] leading-relaxed text-gray-800">
            <section>
              <h2 className="mb-3 text-base font-bold text-gray-900">Begeleiding</h2>
              <p className="mb-3 text-sm text-gray-600">
                Wijzig hoeveel wij voor u mogen regelen. Uw overzicht past zich direct aan.
              </p>
              <div className="space-y-3">
                {(['maximaal', 'zelf', 'keuze'] as Begeleidingsniveau[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNiveau(n)}
                    className={`w-full rounded-lg border p-3 text-left text-sm ${
                      voorkeur.niveau === n
                        ? 'border-[#007AC8] bg-[#E8F4FC]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-semibold">{BEGELEIDING_LABELS[n]}</span>
                  </button>
                ))}

                {voorkeur.niveau === 'keuze' && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Zelf regelen</p>
                    <div className="flex flex-wrap gap-2">
                      {DELEGATIE_ORGANISATIES.map((org) => (
                        <button
                          key={org}
                          type="button"
                          onClick={() => toggleOrg(org)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            voorkeur.zelfRegelenOrganisaties.includes(org)
                              ? 'bg-[#007AC8] text-white'
                              : 'bg-white ring-1 ring-gray-300'
                          }`}
                        >
                          {org}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <h2 className="mb-3 text-base font-bold text-gray-900">Ondersteuning vanuit de overheid</h2>
              <p className="mb-4 text-sm">
                Om u te helpen hebben organisaties van de overheid gegevens voor uw stappenplan
                klaarstaan. Deze vindt u onderaan de pagina. Geef toestemming om gegevens te delen
                zodat wij u gerichter kunnen ondersteunen.
              </p>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <GovernmentToggle
                  checked={settings.governmentSupport}
                  onChange={() => toggleSetting('governmentSupport')}
                />
                <span className="text-sm">een overzicht te sturen van zaken die nog geregeld moeten worden</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <GovernmentToggle
                  checked={settings.suggestions}
                  onChange={() => toggleSetting('suggestions')}
                />
                <span className="text-sm">
                  suggesties te doen welke instanties op de hoogte gebracht kunnen worden
                </span>
              </div>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <h2 className="mb-3 text-base font-bold text-gray-900">Meldingen ontvangen</h2>
              <p className="mb-4 text-sm">
                U kiest zelf welke meldingen u ontvangt. Zet een schakelaar op AAN om meldingen te
                ontvangen, of op UIT om ze uit te zetten.
              </p>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <GovernmentToggle
                    checked={settings.emailSteps}
                    onChange={() => toggleSetting('emailSteps')}
                  />
                  <span className="text-sm">E-mails bij belangrijke stappen of herinneringen</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <GovernmentToggle
                    checked={settings.emailNotifications}
                    onChange={() => toggleSetting('emailNotifications')}
                  />
                  <span className="text-sm">E-mailnotificaties over uw situatie</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <GovernmentToggle
                    checked={settings.inAppNotifications}
                    onChange={() => toggleSetting('inAppNotifications')}
                  />
                  <span className="text-sm">Notificaties in MijnOverheid</span>
                </div>
              </div>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <h2 className="mb-3 text-base font-bold text-gray-900">Overig</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Gecondoleerd</h3>
                  <p>
                    De gemeente heeft aangegeven dat u nabestaande bent. Gecondoleerd met uw verlies.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Uitstel van verplichtingen</h3>
                  <p>
                    Dit kan een moeilijke tijd zijn voor u en uw dierbaren. Daarom kunt u in de eerste
                    drie maanden na het overlijden van uw naaste niet verplicht met uw situatie aan de
                    slag.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Gebruik maken van de ID-wallet?</h3>
                  <p>
                    De ID-wallet kan u helpen met het regelen van zaken. Lees hier meer over uw
                    ID-wallet en welke documenten u daarmee kunt delen.
                  </p>
                </div>

                {onResetOnboarding && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onResetOnboarding();
                    }}
                    className="text-sm text-gray-500 underline-offset-2 hover:underline"
                  >
                    Introductie opnieuw doorlopen
                  </button>
                )}
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
