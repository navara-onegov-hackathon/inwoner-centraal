import type { OverzichtResponse, StatusBoard, Taak } from '../types/overzicht';

export type StappenplanTabId = 'nog-te-doen' | 'gedaan' | 'wat-doen-wij' | 'recht-op';
export type StappenplanRowKind = 'taak' | 'agent' | 'regeling' | 'verwacht' | 'geen_actie';

export interface StappenplanRow {
  id: string;
  kind: StappenplanRowKind;
  title: string;
  description: string;
  organisatie: string;
  locked?: boolean;
  completed?: boolean;
  deadline?: string;
  taakId?: string;
}

export type StappenplanTabRows = Record<StappenplanTabId, StappenplanRow[]>;

function taakRow(taak: Taak): StappenplanRow {
  return {
    id: taak.id,
    kind: 'taak',
    title: taak.titel,
    description: taak.samenvatting,
    organisatie: taak.organisatie,
    deadline: taak.deadline,
    taakId: taak.id,
  };
}

export function mapOverzichtToStappenplanTabs(
  board: StatusBoard,
  _overzicht: OverzichtResponse,
  isUitgebreid: boolean,
): StappenplanTabRows {
  const watDoenWij: StappenplanRow[] = [
    ...board.op_achtergrond.map((s) => ({
      id: s.id,
      kind: 'agent' as const,
      title: s.omschrijving,
      description: `${s.organisatie} — bezig op de achtergrond`,
      organisatie: s.organisatie,
      locked: true,
    })),
    ...board.geregeld_door_ons.regelingen.map((r) => ({
      id: r.id,
      kind: 'regeling' as const,
      title: r.titel,
      description: r.toelichting,
      organisatie: r.organisatie,
    })),
    ...board.geregeld_door_ons.agentstappen.map((s) => ({
      id: s.id,
      kind: 'agent' as const,
      title: s.omschrijving,
      description: `${s.organisatie} — uitgevoerd`,
      organisatie: s.organisatie,
      completed: true,
    })),
  ];

  const gedaan: StappenplanRow[] = [
    ...board.afgerond.regelingen.map((r) => ({
      id: r.id,
      kind: 'regeling' as const,
      title: r.titel,
      description: r.toelichting,
      organisatie: r.organisatie,
      completed: true,
    })),
    ...(isUitgebreid
      ? board.afgerond.geen_actie.map((g) => ({
          id: g.id,
          kind: 'geen_actie' as const,
          title: g.titel,
          description: `Verzonden ${g.verzonden_op}`,
          organisatie: g.organisatie,
          completed: true,
        }))
      : []),
  ];

  return {
    'nog-te-doen': board.actie_van_u.map(taakRow),
    'wat-doen-wij': watDoenWij,
    gedaan,
    'recht-op': board.wachten_op_organisatie.map((v) => ({
      id: v.id,
      kind: 'verwacht',
      title: v.titel,
      description: v.toelichting,
      organisatie: v.organisatie,
    })),
  };
}

export function pickUrgentRowIds(rows: StappenplanRow[]): string[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });
  return sorted.slice(0, 2).map((r) => r.id);
}

export function countProgress(tabs: StappenplanTabRows): { done: number; total: number } {
  const progress = buildStappenplanProgress(tabs);
  return { done: progress.completedCount, total: progress.totalCount };
}

export interface StappenplanProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
  userTasksComplete: boolean;
}

export function buildStappenplanProgress(tabs: StappenplanTabRows): StappenplanProgress {
  const openByYou = tabs['nog-te-doen'].length;
  const completedCount = tabs.gedaan.length;
  const totalCount = Math.max(openByYou + completedCount, 1);
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percentage,
    isComplete: openByYou === 0 && completedCount > 0,
    userTasksComplete: openByYou === 0,
  };
}
