import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import {
  DEFAULT_BEGELEIDING,
  DEFAULT_GEGEVENS,
  type BegeleidingsVoorkeur,
  type GegevensProfiel,
} from '../../types/begeleiding';
import { AgentPlanStep } from './steps/AgentPlanStep';
import { BegeleidingStep } from './steps/BegeleidingStep';
import { CondoleanceStep } from './steps/CondoleanceStep';
import { DelegatieAfgerondStep } from './steps/DelegatieAfgerondStep';
import { DelegatieStep } from './steps/DelegatieStep';
import { VerifyGegevensStep } from './steps/VerifyGegevensStep';
import type { PersonaContext } from '../../types/overzicht';

interface StartWizardProps {
  persona: PersonaContext;
  initialVoorkeur: BegeleidingsVoorkeur;
  onVoorkeurChange: (v: BegeleidingsVoorkeur) => void;
  onComplete: (gegevens: GegevensProfiel) => void;
  onRestartDemo: () => void;
}

const STEPS = ['condoleance', 'delegatie', 'begeleiding', 'agentPlan', 'verifyGegevens'] as const;

export function StartWizard({
  persona,
  initialVoorkeur,
  onVoorkeurChange,
  onComplete,
  onRestartDemo,
}: StartWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [voorkeur, setVoorkeur] = useState<BegeleidingsVoorkeur>(initialVoorkeur);
  const [gegevens, setGegevens] = useState<GegevensProfiel>(DEFAULT_GEGEVENS);
  const [delegatedTo, setDelegatedTo] = useState<string | null>(null);

  const step = STEPS[stepIndex];

  const updateVoorkeur = (next: BegeleidingsVoorkeur) => {
    setVoorkeur(next);
    onVoorkeurChange(next);
  };

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  if (delegatedTo) {
    return (
      <DelegatieAfgerondStep delegateName={delegatedTo} onRestartDemo={onRestartDemo} />
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-2xl flex-col px-6 py-10">
      <div className="mb-8 flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-[#007AC8]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-1 flex-col"
          >
            {step === 'condoleance' && (
              <CondoleanceStep persona={persona} onNext={next} />
            )}
            {step === 'delegatie' && (
              <DelegatieStep
                onSelfContinue={next}
                onTogether={next}
                onDelegate={setDelegatedTo}
                onBack={back}
              />
            )}
            {step === 'begeleiding' && (
              <BegeleidingStep
                voorkeur={voorkeur}
                onChange={updateVoorkeur}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 'agentPlan' && (
              <AgentPlanStep voorkeur={voorkeur} onNext={next} onBack={back} />
            )}
            {step === 'verifyGegevens' && (
              <VerifyGegevensStep
                gegevens={gegevens}
                onChange={setGegevens}
                onBack={back}
                onComplete={() => onComplete(gegevens)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { DEFAULT_BEGELEIDING };
