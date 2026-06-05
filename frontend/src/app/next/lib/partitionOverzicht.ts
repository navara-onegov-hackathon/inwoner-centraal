import type { BegeleidingsVoorkeur } from '../types/begeleiding';
import type { OverzichtResponse, StatusBoard, Taak } from '../types/overzicht';

function isDelegatedToAgent(organisatie: string, prefs: BegeleidingsVoorkeur): boolean {
  if (prefs.assistance === 'max') return true;
  if (prefs.assistance === 'none' || prefs.assistance === 'partial') return false;
  return !prefs.zelfRegelenOrganisaties.includes(organisatie);
}

export function shouldShowInActieVanU(taak: Taak, prefs: BegeleidingsVoorkeur): boolean {
  if (prefs.assistance === 'none' || prefs.assistance === 'partial') return true;
  if (!isDelegatedToAgent(taak.organisatie, prefs)) return true;
  return taak.handeling_door_nabestaande;
}

export function partitionOverzicht(
  overzicht: OverzichtResponse,
  prefs: BegeleidingsVoorkeur,
): StatusBoard {
  const openTasks = overzicht.taken.filter((t) => t.state !== 'done');
  const doneTasks = overzicht.taken.filter((t) => t.state === 'done');
  const actie_van_u = openTasks.filter((t) => shouldShowInActieVanU(t, prefs));

  const showAgentActivity = prefs.assistance === 'max';
  const op_achtergrond = showAgentActivity
    ? overzicht.agentstappen.filter((s) => s.status === 'bezig')
    : [];

  const geregeldAgentstappen = showAgentActivity
    ? overzicht.agentstappen.filter((s) => s.status === 'voltooid')
    : [];
  const geregeldRegelingen = overzicht.regelingen.filter((r) => r.status === 'in_behandeling');

  const wachten_op_organisatie = overzicht.verwacht_binnenkort;

  const afgerondRegelingen = overzicht.regelingen.filter((r) => r.status === 'afgerond');
  const afgerond = {
    taken: doneTasks,
    regelingen: afgerondRegelingen,
    geen_actie: overzicht.geen_actie_nodig,
  };

  return {
    actie_van_u,
    op_achtergrond,
    geregeld_door_ons: {
      agentstappen: geregeldAgentstappen,
      regelingen: geregeldRegelingen,
    },
    wachten_op_organisatie,
    afgerond,
  };
}

export function buildSamenvattingCounts(board: StatusBoard) {
  return {
    actie_van_u: board.actie_van_u.length,
    op_achtergrond: board.op_achtergrond.length,
    geregeld_door_ons:
      board.geregeld_door_ons.agentstappen.length + board.geregeld_door_ons.regelingen.length,
    wachten_op_organisatie: board.wachten_op_organisatie.length,
    afgerond:
      board.afgerond.taken.length + board.afgerond.regelingen.length + board.afgerond.geen_actie.length,
  };
}

export function applyPartitionToOverzicht(
  overzicht: OverzichtResponse,
  prefs: BegeleidingsVoorkeur,
): OverzichtResponse & { statusBoard: StatusBoard } {
  const statusBoard = partitionOverzicht(overzicht, prefs);
  return {
    ...overzicht,
    samenvatting: buildSamenvattingCounts(statusBoard),
    statusBoard,
  };
}
