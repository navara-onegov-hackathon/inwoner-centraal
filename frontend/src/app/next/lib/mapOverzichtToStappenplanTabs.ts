import type { OverzichtResponse, StatusBoard, Taak } from '../types/overzicht';

export type StappenplanTabId = 'urgent' | 'in-behandeling' | 'gedaan' | 'wat-doen-wij';
export type StappenplanRowKind = 'taak' | 'agent' | 'regeling' | 'verwacht' | 'geen_actie';

export const URGENT_DAYS = 14;

export interface StappenplanRow {
  id: string;
  kind: StappenplanRowKind;
  title: string;
  description: string;
  organisatie: string;
  locked?: boolean;
  completed?: boolean;
  deadline?: string;
  urgent?: boolean;
  taakId?: string;
}

export type StappenplanTabRows = Record<StappenplanTabId, StappenplanRow[]>;

function daysUntil(deadline: string, referenceDate: string): number {
  const ms = new Date(deadline).getTime() - new Date(referenceDate).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function isUrgentTask(taak: Taak | undefined, referenceDate: string): boolean {
  if (!taak) return false;
  if (taak.urgent === true) return true;
  if (taak.deadline) {
    return daysUntil(taak.deadline, referenceDate) <= URGENT_DAYS;
  }
  return false;
}

function sortByDueDateFirst(rows: StappenplanRow[]): StappenplanRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const aHas = Boolean(a.row.deadline);
      const bHas = Boolean(b.row.deadline);
      if (aHas && bHas) {
        const byDeadline = a.row.deadline!.localeCompare(b.row.deadline!);
        if (byDeadline !== 0) return byDeadline;
      } else if (aHas !== bHas) {
        return aHas ? -1 : 1;
      }
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

function taakRow(taak: Taak, referenceDate: string): StappenplanRow {
  const urgent = isUrgentTask(taak, referenceDate);
  return {
    id: taak.id,
    kind: 'taak',
    title: taak.titel,
    description: taak.samenvatting,
    organisatie: taak.organisatie,
    deadline: taak.deadline,
    urgent,
    taakId: taak.id,
  };
}

function partitionOpenTasks(
  taken: Taak[],
  referenceDate: string,
): { urgent: StappenplanRow[]; inBehandeling: StappenplanRow[] } {
  const urgent: StappenplanRow[] = [];
  const inBehandeling: StappenplanRow[] = [];

  for (const taak of taken) {
    const row = taakRow(taak, referenceDate);
    if (row.urgent) {
      urgent.push(row);
    } else {
      inBehandeling.push(row);
    }
  }

  return {
    urgent: sortByDueDateFirst(urgent),
    inBehandeling: sortByDueDateFirst(inBehandeling),
  };
}

export function mapOverzichtToStappenplanTabs(
  board: StatusBoard,
  _overzicht: OverzichtResponse,
  isUitgebreid: boolean,
  referenceDate: string,
): StappenplanTabRows {
  const { urgent, inBehandeling } = partitionOpenTasks(board.actie_van_u, referenceDate);

  const watDoenWij: StappenplanRow[] = [
    ...sortByDueDateFirst(board.geregeld_door_ons.taken.map((taak) => taakRow(taak, referenceDate))),
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
    ...board.afgerond.taken.map((taak) => ({
      id: taak.id,
      kind: 'taak' as const,
      title: taak.titel,
      description: taak.samenvatting,
      organisatie: taak.organisatie,
      completed: true,
      taakId: taak.id,
    })),
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
    urgent,
    'in-behandeling': inBehandeling,
    'wat-doen-wij': watDoenWij,
    gedaan,
  };
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
  const openByYou = tabs.urgent.length + tabs['in-behandeling'].length;
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
