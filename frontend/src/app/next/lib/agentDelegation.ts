import type { BegeleidingsVoorkeur } from '../types/begeleiding';
import type { Agentstap, OverzichtResponse, Taak } from '../types/overzicht';
import { persistOverzicht } from './overzichtState';

export const DELEGATED_AGENT_STEP_SUFFIX = '-delegated';

export function allowsOnDemandAgent(voorkeur: BegeleidingsVoorkeur): boolean {
  return voorkeur.assistance === 'none' || voorkeur.assistance === 'partial';
}

export function isAgentDelegatedTask(taak: Taak): boolean {
  return taak.handled_by === 'us' && taak.state !== 'done';
}

export function canOfferAgentForTask(taak: Taak, voorkeur: BegeleidingsVoorkeur): boolean {
  if (!allowsOnDemandAgent(voorkeur)) return false;
  if (taak.state === 'done') return false;
  if (isAgentDelegatedTask(taak)) return false;
  return true;
}

export function isUserInitiatedAgentStep(step: Agentstap): boolean {
  return step.id.endsWith(DELEGATED_AGENT_STEP_SUFFIX);
}

export function delegateTaskToAgent(
  overzicht: OverzichtResponse,
  taskId: string,
): OverzichtResponse | null {
  const taak = overzicht.taken.find((item) => item.id === taskId);
  if (!taak || isAgentDelegatedTask(taak)) return null;

  const agentStepId = `agentstap-${taskId}${DELEGATED_AGENT_STEP_SUFFIX}`;
  const agentStep: Agentstap = {
    id: agentStepId,
    organisatie: taak.organisatie,
    omschrijving: `${taak.titel} — wij regelen dit voor u`,
    uitgevoerd_op: new Date().toISOString().slice(0, 10),
    type: 'voorbereid_door_agent',
    status: 'bezig',
  };

  const next: OverzichtResponse = {
    ...overzicht,
    taken: overzicht.taken.map((item) =>
      item.id === taskId
        ? {
            ...item,
            handled_by: 'us',
            status: 'in_behandeling',
            state: 'pending',
            urgent: undefined,
            toon_cta_in_lijst: false,
            cta_label: undefined,
            form: null,
            resolution_options: [],
            awaiting_self_completion: undefined,
            self_completion_data: undefined,
          }
        : item,
    ),
    agentstappen: [
      ...overzicht.agentstappen.filter((step) => step.id !== agentStepId),
      agentStep,
    ],
  };

  persistOverzicht(next);
  return next;
}
