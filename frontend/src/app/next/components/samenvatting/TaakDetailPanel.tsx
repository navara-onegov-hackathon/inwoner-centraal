import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../legacy/components/ui/sheet';
import type { OverzichtResponse, Taak } from '../../types/overzicht';

interface TaakDetailPanelProps {
  taak: Taak | null;
  overzicht: OverzichtResponse;
  isUitgebreid: boolean;
  open: boolean;
  onClose: () => void;
}

export function TaakDetailPanel({ taak, overzicht, isUitgebreid, open, onClose }: TaakDetailPanelProps) {
  if (!taak) return null;

  const brieven = overzicht.correspondentie.filter((b) => taak.bron_brief_ids.includes(b.id));
  const verplichtingen = overzicht.verplichtingen.filter((v) =>
    taak.bron_verplichting_ids.includes(v.id),
  );
  const agentstappen = overzicht.agentstappen.filter((s) => s.organisatie === taak.organisatie);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{taak.titel}</SheetTitle>
          <SheetDescription>{taak.organisatie}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <p className="text-sm leading-relaxed text-gray-700">{taak.samenvatting}</p>

          {taak.deadline && (
            <p className="text-sm text-gray-600">
              Deadline:{' '}
              {new Date(taak.deadline).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}

          {agentstappen.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Wat wij al deden</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {agentstappen.map((s) => (
                  <li key={s.id}>→ {s.omschrijving}</li>
                ))}
              </ul>
            </div>
          )}

          {taak.toon_cta_in_lijst && taak.cta_label && (
            <button
              type="button"
              className="rounded-md bg-[#007AC8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0069AD]"
            >
              {taak.cta_label}
            </button>
          )}

          {isUitgebreid && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Onderliggende gegevens</h3>

              {brieven.map((b) => (
                <div key={b.id} className="rounded-md bg-gray-50 p-3 text-sm">
                  <p className="font-semibold">Brief — {b.type}</p>
                  <p className="text-gray-600">{b.aanhef}</p>
                  <p className="mt-1 text-gray-500">Verzonden: {b.verzonden_op}</p>
                  {b.actie_omschrijving && <p className="mt-1">{b.actie_omschrijving}</p>}
                </div>
              ))}

              {verplichtingen.map((v) => (
                <div key={v.id} className="rounded-md bg-gray-50 p-3 text-sm">
                  <p className="font-semibold">Verplichting</p>
                  <p>{v.omschrijving}</p>
                  {v.bedrag && <p className="mt-1">€ {v.bedrag.bedrag}</p>}
                  <p className="text-gray-500">Vervaldatum: {v.vervaldatum}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
