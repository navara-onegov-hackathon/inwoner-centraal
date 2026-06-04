import { Bot, User } from 'lucide-react';
import { countAgentSteps, getPlannedAgentSteps } from '../../../lib/getPlannedAgentSteps';
import type { BegeleidingsVoorkeur } from '../../../types/begeleiding';

interface AgentPlanStepProps {
  voorkeur: BegeleidingsVoorkeur;
  onNext: () => void;
  onBack: () => void;
}

export function AgentPlanStep({ voorkeur, onNext, onBack }: AgentPlanStepProps) {
  const steps = getPlannedAgentSteps(voorkeur);
  const counts = countAgentSteps(steps);
  const agentSteps = steps.filter((s) => s.voorWie === 'agent');
  const userSteps = steps.filter((s) => s.voorWie === 'u');

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Dit gaan wij voor u doen</h1>
        <p className="mb-6 text-sm text-gray-600">
          Op basis van uw keuze ziet u hier wat onze agents op de achtergrond regelen en waar wij
          uw hulp nodig hebben.
        </p>

        <div className="mb-6 flex gap-3">
          <div className="flex-1 rounded-lg bg-blue-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-[#007AC8]">{counts.agent}</p>
            <p className="text-xs text-gray-600">Door ons geregeld</p>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{counts.u}</p>
            <p className="text-xs text-gray-600">Via u</p>
          </div>
        </div>

        {agentSteps.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#007AC8]">
              <Bot className="h-4 w-4" aria-hidden />
              Op de achtergrond
            </h2>
            <ul className="space-y-2">
              {agentSteps.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-gray-800"
                >
                  <span className="font-semibold">{s.organisatie}</span> — {s.omschrijving}
                </li>
              ))}
            </ul>
          </div>
        )}

        {userSteps.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              <User className="h-4 w-4" aria-hidden />
              Waar wij u nodig hebben
            </h2>
            <ul className="space-y-2">
              {userSteps.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800"
                >
                  <span className="font-semibold">{s.organisatie}</span> — {s.omschrijving}
                </li>
              ))}
            </ul>
          </div>
        )}

        {voorkeur.niveau === 'zelf' && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950">
            U koos om zelf te regelen. Wij tonen vooral informatie; agents voeren geen acties uit
            tenzij u dat later alsnog vraagt.
          </p>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-md border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Terug
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD]"
        >
          Verder
        </button>
      </div>
    </>
  );
}
