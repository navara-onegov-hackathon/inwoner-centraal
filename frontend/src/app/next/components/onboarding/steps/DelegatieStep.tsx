import { User, Users } from 'lucide-react';
import { useState } from 'react';

interface DelegatieStepProps {
  onSelfContinue: () => void;
  onDelegate: (name: string) => void;
  onBack: () => void;
}

export function DelegatieStep({ onSelfContinue, onDelegate, onBack }: DelegatieStepProps) {
  const [mode, setMode] = useState<'self' | 'other' | null>(null);
  const [name, setName] = useState('');

  const canSubmitDelegate = name.trim().length >= 2;

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Wilt u dat iemand anders verder helpt?
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Niet iedereen wil zelf alle stappen doorlopen. U kunt iemand vertrouwd — bijvoorbeeld een
          kind of familielid — de verdere regeling laten overnemen. Die persoon krijgt dan dezelfde
          begeleide stappen.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMode('self')}
            className={`w-full rounded-lg border p-4 text-left transition ${
              mode === 'self'
                ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 shrink-0 text-[#007AC8]" aria-hidden />
              <div>
                <p className="font-bold text-gray-900">Ik regel het zelf verder</p>
                <p className="mt-1 text-sm text-gray-600">
                  U doorloopt de volgende stappen en ziet daarna uw persoonlijke overzicht.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('other')}
            className={`w-full rounded-lg border p-4 text-left transition ${
              mode === 'other'
                ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#007AC8]" aria-hidden />
              <div>
                <p className="font-bold text-gray-900">Iemand anders neemt het over</p>
                <p className="mt-1 text-sm text-gray-600">
                  Bijvoorbeeld uw dochter of een andere nabestaande. Zij krijgen toegang en doorlopen
                  hetzelfde traject.
                </p>
              </div>
            </div>
          </button>
        </div>

        {mode === 'other' && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label htmlFor="delegate-name" className="mb-2 block text-sm font-semibold text-gray-900">
              Naam van de persoon die het overneemt
            </label>
            <input
              id="delegate-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijvoorbeeld: Lisa de Vries"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#007AC8] focus:outline-none focus:ring-1 focus:ring-[#007AC8]"
            />
            <p className="mt-2 text-xs text-gray-500">
              In de demo sturen we een uitnodiging. Voor de jury tonen we het hoofdtraject via uw
              eigen voortgang.
            </p>
          </div>
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
        {mode === 'self' && (
          <button
            type="button"
            onClick={onSelfContinue}
            className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD]"
          >
            Verder
          </button>
        )}
        {mode === 'other' && (
          <button
            type="button"
            disabled={!canSubmitDelegate}
            onClick={() => onDelegate(name.trim())}
            className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Overdragen
          </button>
        )}
      </div>
    </>
  );
}
