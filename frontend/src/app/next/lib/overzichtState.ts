import { CASE_DATA_STORAGE_KEY, OVERZICHT_STORAGE_KEY } from '../types/begeleiding';
import type { OverzichtResponse, Taak } from '../types/overzicht';

export type CaseData = Record<string, unknown>;

export function readCaseData(): CaseData {
  try {
    const raw = window.localStorage.getItem(CASE_DATA_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CaseData) : {};
  } catch {
    return {};
  }
}

export function writeCaseData(next: CaseData) {
  window.localStorage.setItem(CASE_DATA_STORAGE_KEY, JSON.stringify(next));
}

export function persistOverzicht(next: OverzichtResponse) {
  window.localStorage.setItem(OVERZICHT_STORAGE_KEY, JSON.stringify(next));
}

export function completeTask(
  overzicht: OverzichtResponse,
  taskId: string,
  caseDataPatch: CaseData = {},
): OverzichtResponse {
  const next = {
    ...overzicht,
    taken: overzicht.taken.map((taak) => (taak.id === taskId ? toDoneTask(taak) : taak)),
  };
  persistOverzicht(next);
  writeCaseData({ ...readCaseData(), ...caseDataPatch });
  return next;
}

function toDoneTask(taak: Taak): Taak {
  return {
    ...taak,
    state: 'done',
    status: 'in_behandeling',
    urgent: undefined,
    toon_cta_in_lijst: false,
    cta_label: undefined,
    form: null,
    resolution_options: [],
  };
}
