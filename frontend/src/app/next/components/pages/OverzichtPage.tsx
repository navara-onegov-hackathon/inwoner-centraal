import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { DataCorrectionBlock } from '../../../shared/components/DataCorrectionBlock';
import { applyPartitionToOverzicht } from '../../lib/partitionOverzicht';
import type { BegeleidingsVoorkeur } from '../../types/begeleiding';
import { useDetailniveau } from '../../hooks/useDetailniveau';
import { useOverzicht } from '../../hooks/useOverzicht';
import { useTaakHash } from '../../hooks/useTaakHash';
import { usePostadresKeuze } from '../../hooks/useBegeleiding';
import { TaakRow } from '../samenvatting/TaakRow';
import { TaakDetailPanel } from '../samenvatting/TaakDetailPanel';
import { BackgroundActivityItem, StatusLane } from '../overzicht/StatusLane';
import { StatusBoardHeader } from '../overzicht/StatusBoardHeader';

interface OverzichtPageProps {
  voorkeur: BegeleidingsVoorkeur;
}

export function OverzichtPage({ voorkeur }: OverzichtPageProps) {
  const { data, error, loading } = useOverzicht();
  const { isUitgebreid } = useDetailniveau();
  const { openTaakId, openTaak, closeTaak } = useTaakHash();
  const { postadresKeuze } = usePostadresKeuze();

  const partitioned = useMemo(
    () => (data ? applyPartitionToOverzicht(data, voorkeur) : null),
    [data, voorkeur],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#007AC8]">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Laden..." />
      </div>
    );
  }

  if (error || !partitioned) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-900">
          {error ?? 'Overzicht kon niet worden geladen.'}
        </div>
      </div>
    );
  }

  const { statusBoard, samenvatting, persona } = partitioned;
  const selectedTaak = partitioned.taken.find((t) => t.id === openTaakId) ?? null;
  const showPostadresReminder = postadresKeuze === 'later' && persona.postadres_alert;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Uw overzicht</h1>
        <p className="mt-1 text-sm text-gray-600">
          {persona.nabestaande.split(' ')[0]} — na het overlijden van {persona.overledene.split(' ')[0]}
        </p>
      </header>

      {showPostadresReminder && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {persona.postadres_alert}{' '}
          <button
            type="button"
            className="font-semibold text-[#007AC8] underline-offset-2 hover:underline"
            onClick={() =>
              document.getElementById('gegevens-aanvullen')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Postadres doorgeven
          </button>
        </div>
      )}

      <StatusBoardHeader counts={samenvatting} />

      <StatusLane
        id="lane-actie_van_u"
        title="Actie van u"
        description="Taken waarvoor wij uw handeling nodig hebben — betalen, tekenen of indienen."
        count={statusBoard.actie_van_u.length}
        defaultOpen
        accentClass="border-red-100"
      >
        <div className="space-y-3">
          {statusBoard.actie_van_u.map((taak) => (
            <TaakRow key={taak.id} taak={taak} onOpen={openTaak} />
          ))}
        </div>
        <div id="gegevens-aanvullen" className="mt-6">
          <DataCorrectionBlock />
        </div>
      </StatusLane>

      <StatusLane
        id="lane-op_achtergrond"
        title="Op de achtergrond"
        description="Onze agents zijn nu bezig — u hoeft niets te doen."
        count={statusBoard.op_achtergrond.length}
        defaultOpen
        accentClass="border-blue-100"
        emptyMessage={
          voorkeur.niveau === 'zelf'
            ? 'U regelt zelf — er draaien geen agents op de achtergrond.'
            : 'Geen lopende agentactiviteit.'
        }
      >
        <div className="space-y-2">
          {statusBoard.op_achtergrond.map((s) => (
            <BackgroundActivityItem key={s.id} organisatie={s.organisatie} omschrijving={s.omschrijving} />
          ))}
        </div>
      </StatusLane>

      <StatusLane
        id="lane-geregeld_door_ons"
        title="Geregeld door ons"
        description="Stappen die wij al hebben uitgevoerd of regelingen die zijn gestart."
        count={
          statusBoard.geregeld_door_ons.agentstappen.length +
          statusBoard.geregeld_door_ons.regelingen.length
        }
        defaultOpen
        accentClass="border-green-100"
      >
        <div className="space-y-4">
          {statusBoard.geregeld_door_ons.regelingen.map((r) => (
            <div key={r.id} className="rounded-md bg-green-50 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-900">
                {r.organisatie} — {r.titel}
              </p>
              <p className="text-gray-600">{r.toelichting}</p>
            </div>
          ))}
          {statusBoard.geregeld_door_ons.agentstappen.map((s) => (
            <div key={s.id} className="flex gap-2 text-sm text-gray-800">
              <span className="text-green-600">✓</span>
              <span>
                {s.organisatie} — {s.omschrijving}
              </span>
            </div>
          ))}
        </div>
      </StatusLane>

      <StatusLane
        id="lane-wachten_op_organisatie"
        title="Wachten op organisatie"
        description="Externe organisaties moeten nog reageren of beslissen."
        count={statusBoard.wachten_op_organisatie.length}
        defaultOpen={statusBoard.wachten_op_organisatie.length > 0}
        accentClass="border-amber-100"
      >
        <ul className="space-y-2">
          {statusBoard.wachten_op_organisatie.map((item) => (
            <li key={item.id} className="rounded-md border border-amber-100 px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">
                {item.organisatie} — {item.titel}
              </p>
              <p className="text-gray-600">{item.toelichting}</p>
            </li>
          ))}
        </ul>
      </StatusLane>

      <StatusLane
        id="lane-afgerond"
        title="Afgerond"
        description="Afgeronde regelingen en berichten zonder vervolgactie."
        count={statusBoard.afgerond.regelingen.length + statusBoard.afgerond.geen_actie.length}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {statusBoard.afgerond.regelingen.map((r) => (
            <div key={r.id} className="text-sm text-gray-800">
              ✓ {r.organisatie} — {r.titel}
            </div>
          ))}
          {isUitgebreid &&
            statusBoard.afgerond.geen_actie.map((item) => (
              <div key={item.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {item.organisatie} — {item.titel}
              </div>
            ))}
          {!isUitgebreid && statusBoard.afgerond.geen_actie.length > 0 && (
            <p className="text-sm text-gray-500">
              {statusBoard.afgerond.geen_actie.length} informatieve berichten (details in taakpaneel)
            </p>
          )}
        </div>
      </StatusLane>

      <TaakDetailPanel
        taak={selectedTaak}
        overzicht={partitioned}
        isUitgebreid={isUitgebreid}
        open={Boolean(selectedTaak)}
        onClose={closeTaak}
      />
    </div>
  );
}
