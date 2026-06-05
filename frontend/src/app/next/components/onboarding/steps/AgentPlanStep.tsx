import { CircleDashed } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { startIntakeDiscovery } from '../../../api/intakeDiscovery';
import type { BegeleidingsVoorkeur } from '../../../types/begeleiding';
import type { OverzichtResponse } from '../../../types/overzicht';

interface AgentPlanStepProps {
  voorkeur: BegeleidingsVoorkeur;
  initialResult: OverzichtResponse | null;
  onDiscoveryComplete: (result: OverzichtResponse) => void;
  onNext: () => void;
  onBack: () => void;
}

interface LogLine {
  id: string;
  text: string;
  status: 'pending' | 'done';
}

export function AgentPlanStep({
  voorkeur,
  initialResult,
  onDiscoveryComplete,
  onNext,
  onBack,
}: AgentPlanStepProps) {
  const [lines, setLines] = useState<LogLine[]>(() =>
    initialResult
      ? [{ id: 'complete', text: 'Gegevens zijn al verzameld voor deze sessie.', status: 'done' }]
      : [{ id: 'start', text: 'Gegevenscontrole voorbereiden', status: 'pending' }],
  );
  const [resultReady, setResultReady] = useState(Boolean(initialResult));
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || initialResult) return;
    startedRef.current = true;

    const stream = startIntakeDiscovery(undefined, voorkeur.assistance, {
      onProgress: (event) => {
        setLines((current) => updateLogLines(current, event.line));
      },
      onResult: (result) => {
        setLines((current) => markCurrentDone(current));
        setResultReady(true);
        onDiscoveryComplete(result);
      },
      onError: (message) => {
        setError(message);
        setLines((current) => markCurrentDone(current));
      },
    });

    return () => stream.close();
  }, [initialResult, onDiscoveryComplete, voorkeur.assistance]);

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">We maken een overzicht van uw situatie</h1>
        <p className="mb-6 text-sm text-gray-600">
          Tijdens deze stap halen wij algemene gegevens op. We kijken welke processen voor u
          relevant zijn.
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-2">
            {lines.map((line, index) => {
              const isCurrentPending = line.status === 'pending' && index === lines.length - 1 && !resultReady;
              return (
                <div
                  key={line.id}
                  className={`flex items-start gap-3 text-sm ${
                    isCurrentPending ? 'text-[#007AC8]' : 'text-gray-700'
                  }`}
                >
                  {isCurrentPending ? (
                    <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#007AC8]" />
                  ) : (
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-current">
                      ✓
                    </span>
                  )}
                  <span>{line.text}</span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          )}
        </div>
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
          disabled={!resultReady}
          className={`flex-1 rounded-md py-3 text-sm font-semibold text-white ${
            resultReady ? 'bg-[#007AC8] hover:bg-[#0069AD]' : 'cursor-not-allowed bg-gray-300'
          }`}
        >
          Verder
        </button>
      </div>
    </>
  );
}

function updateLogLines(current: LogLine[], text: string): LogLine[] {
  const next = markCurrentDone(current);
  return [...next, { id: `${Date.now()}-${next.length}`, text, status: 'pending' }];
}

function markCurrentDone(current: LogLine[]) {
  if (current.length === 0) return current;
  return current.map((line, index) =>
    index === current.length - 1 ? { ...line, status: 'done' as const } : line,
  );
}
