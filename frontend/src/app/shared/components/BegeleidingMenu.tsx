import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
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

interface BegeleidingMenuProps {
  voorkeur: BegeleidingsVoorkeur;
  onChange: (v: BegeleidingsVoorkeur) => void;
  onResetOnboarding?: () => void;
}

export function BegeleidingMenu({ voorkeur, onChange, onResetOnboarding }: BegeleidingMenuProps) {
  const [open, setOpen] = useState(false);

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
        Begeleiding: {BEGELEIDING_LABELS[voorkeur.niveau]}
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Begeleidingsvoorkeur</SheetTitle>
            <SheetDescription>
              Wijzig hoeveel wij voor u mogen regelen. Uw overzicht past zich direct aan.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4 pb-6">
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

            {onResetOnboarding && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onResetOnboarding();
                }}
                className="mt-4 w-full text-left text-sm text-gray-500 underline-offset-2 hover:underline"
              >
                Introductie opnieuw doorlopen
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
