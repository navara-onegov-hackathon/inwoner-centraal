import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { PersonaContext } from '../../types/overzicht';
import {
  DEFAULT_BEGELEIDING,
  type BegeleidingsVoorkeur,
  type PostadresKeuze,
} from '../../types/begeleiding';
import { BegeleidingStep } from './steps/BegeleidingStep';
import { CondoleanceStep } from './steps/CondoleanceStep';
import { PostadresStep } from './steps/PostadresStep';
import { ReviewStep } from './steps/ReviewStep';

interface StartWizardProps {
  persona: PersonaContext;
  initialVoorkeur: BegeleidingsVoorkeur;
  onVoorkeurChange: (v: BegeleidingsVoorkeur) => void;
  onComplete: (postadresKeuze: PostadresKeuze) => void;
}

const STEPS = ['condoleance', 'begeleiding', 'postadres', 'review'] as const;

export function StartWizard({
  persona,
  initialVoorkeur,
  onVoorkeurChange,
  onComplete,
}: StartWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [voorkeur, setVoorkeur] = useState<BegeleidingsVoorkeur>(initialVoorkeur);
  const [postadresKeuze, setPostadresKeuze] = useState<PostadresKeuze>('later');

  const step = STEPS[stepIndex];

  const updateVoorkeur = (next: BegeleidingsVoorkeur) => {
    setVoorkeur(next);
    onVoorkeurChange(next);
  };

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

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
            {step === 'begeleiding' && (
              <BegeleidingStep
                voorkeur={voorkeur}
                onChange={updateVoorkeur}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 'postadres' && (
              <PostadresStep
                persona={persona}
                keuze={postadresKeuze}
                onChange={setPostadresKeuze}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 'review' && (
              <ReviewStep
                voorkeur={voorkeur}
                postadresKeuze={postadresKeuze}
                onBack={back}
                onComplete={() => onComplete(postadresKeuze)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { DEFAULT_BEGELEIDING };
