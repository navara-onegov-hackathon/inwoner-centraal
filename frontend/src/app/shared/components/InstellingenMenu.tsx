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
  type AssistanceLevel,
  type BegeleidingsVoorkeur,
  type MeldingenVoorkeur,
} from '../../next/types/begeleiding';
import { MeldingenPreferencesPanel } from './MeldingenPreferencesPanel';

interface InstellingenMenuProps {
  voorkeur: BegeleidingsVoorkeur;
  onChange: (v: BegeleidingsVoorkeur) => void;
  meldingen: MeldingenVoorkeur;
  onMeldingenChange: (v: MeldingenVoorkeur) => void;
  onResetOnboarding?: () => void;
}

export function InstellingenMenu({
  voorkeur,
  onChange,
  meldingen,
  onMeldingenChange,
  onResetOnboarding,
}: InstellingenMenuProps) {
  const [open, setOpen] = useState(false);

  const setNiveau = (assistance: AssistanceLevel) => {
    onChange({ assistance, zelfRegelenOrganisaties: [] });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm font-medium text-gray-800 hover:border-[#007AC8]/40"
      >
        Instellingen
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex !top-12 !bottom-0 !h-[calc(100dvh-3rem)] w-full flex-col gap-0 overflow-hidden border-l border-gray-200 bg-white sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-gray-100 px-6 py-5 pr-12">
            <SheetTitle className="text-lg font-bold text-gray-900">Instellingen</SheetTitle>
            <SheetDescription className="text-sm text-gray-600">
              Begeleiding en meldingen voor uw stappenplan.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6 text-[15px] leading-relaxed text-gray-800">
            <section>
              <h2 className="mb-3 text-base font-bold text-gray-900">Begeleiding</h2>
              <p className="mb-3 text-sm text-gray-600">
                Wijzig hoeveel wij voor u mogen regelen. Uw overzicht past zich direct aan.
              </p>
              <div className="space-y-3">
                {(['max', 'none'] as AssistanceLevel[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNiveau(n)}
                    className={`w-full rounded-lg border p-3 text-left text-sm ${
                      voorkeur.assistance === n
                        ? 'border-[#007AC8] bg-[#E8F4FC]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-semibold">{BEGELEIDING_LABELS[n]}</span>
                  </button>
                ))}
              </div>
            </section>

            <MeldingenPreferencesPanel voorkeur={meldingen} onChange={onMeldingenChange} />
          </div>

          {onResetOnboarding && (
            <div className="mt-auto shrink-0 border-t border-gray-100 px-6 py-4">
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
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
