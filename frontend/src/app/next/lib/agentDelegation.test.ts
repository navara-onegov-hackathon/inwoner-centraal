import { describe, expect, it } from 'vitest';
import fixture from '../../../fixtures/truus-cees.json';
import type { TruusCeesFixture } from '../types/fixture';
import {
  canOfferAgentForTask,
  allowsOnDemandAgent,
  isAgentDelegatedTask,
} from './agentDelegation';
import { deriveOverzicht } from './deriveOverzicht';
import { partitionOverzicht, shouldShowInActieVanU } from './partitionOverzicht';

const DEMO_TODAY = '2025-04-20';
const ZELF = { assistance: 'none' as const, zelfRegelenOrganisaties: [] };
const MAX = { assistance: 'max' as const, zelfRegelenOrganisaties: [] };

describe('agentDelegation', () => {
  const overzicht = deriveOverzicht(fixture as TruusCeesFixture, DEMO_TODAY);
  const taak = overzicht.taken[0];

  it('allows on-demand automatic handling only for zelf regelen', () => {
    expect(allowsOnDemandAgent(ZELF)).toBe(true);
    expect(allowsOnDemandAgent(MAX)).toBe(false);
  });

  it('offers agent delegation for open tasks in zelf regelen mode', () => {
    expect(canOfferAgentForTask(taak, ZELF)).toBe(true);
  });

  it('does not offer agent delegation in maximaal mode', () => {
    expect(canOfferAgentForTask(taak, MAX)).toBe(false);
  });

  it('hides delegated tasks from user action lists', () => {
    const delegatedTaak = {
      ...taak,
      handled_by: 'us' as const,
      state: 'pending' as const,
      status: 'in_behandeling' as const,
    };

    expect(isAgentDelegatedTask(delegatedTaak)).toBe(true);
    expect(shouldShowInActieVanU(delegatedTaak, ZELF)).toBe(false);

    const board = partitionOverzicht(
      {
        ...overzicht,
        taken: overzicht.taken.map((item) => (item.id === taak.id ? delegatedTaak : item)),
        agentstappen: [
          ...overzicht.agentstappen,
          {
            id: `agentstap-${taak.id}-delegated`,
            organisatie: taak.organisatie,
            omschrijving: 'Test',
            uitgevoerd_op: '2025-04-20',
            type: 'voorbereid_door_agent' as const,
            status: 'bezig' as const,
          },
        ],
      },
      ZELF,
    );

    expect(board.actie_van_u.some((item) => item.id === taak.id)).toBe(false);
    expect(board.op_achtergrond).toHaveLength(1);
  });
});
