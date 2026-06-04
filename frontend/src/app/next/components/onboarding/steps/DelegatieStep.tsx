import { User, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';

interface DelegatieStepProps {
  onSelfContinue: () => void;
  onTogether: () => void;
  onDelegate: (name: string) => void;
  onBack: () => void;
}

export function DelegatieStep({ onSelfContinue, onTogether, onDelegate, onBack }: DelegatieStepProps) {
  const [mode, setMode] = useState<'self' | 'other' | null>(null);
  const [otherMode, setOtherMode] = useState<'together' | 'delegate' | null>(null);
  const [name, setName] = useState('');

  const canSubmitDelegate = name.trim().length >= 2;

  const handleModeChange = (next: 'self' | 'other') => {
    setMode(next);
    setOtherMode(null);
    setName('');
  };

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Wilt u dat iemand anders dit voor u regelt?
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Niet iedereen wil zelf alle stappen doorlopen. U kunt de verdere regeling aan iemand
          anders overlaten, of het samen doen.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleModeChange('self')}
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
                  U doorloopt de stappen en ziet daarna uw persoonlijke overzicht.
                </p>
              </div>
            </div>
          </button>

          <div>
            <button
              type="button"
              onClick={() => handleModeChange('other')}
              className={`w-full rounded-lg border p-4 text-left transition ${
                mode === 'other'
                  ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8] rounded-b-none border-b-0'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#007AC8]" aria-hidden />
                <div>
                  <p className="font-bold text-gray-900">Iemand anders helpt mij</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Bijvoorbeeld uw dochter of een buurman.
                  </p>
                </div>
              </div>
            </button>

            {mode === 'other' && (
              <div className="rounded-b-lg border border-t-0 border-[#007AC8] bg-[#E8F4FC] p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setOtherMode('together')}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    otherMode === 'together'
                      ? 'border-[#007AC8] bg-white ring-1 ring-[#007AC8]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#007AC8]" aria-hidden />
                    <div>
                      <p className="text-sm font-bold text-gray-900">We doen het samen</p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        U doorloopt de stappen samen. U behoudt de controle.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOtherMode('delegate')}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    otherMode === 'delegate'
                      ? 'border-[#007AC8] bg-white ring-1 ring-[#007AC8]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-[#007AC8]" aria-hidden />
                    <div>
                      <p className="text-sm font-bold text-gray-900">De andere persoon neemt het over</p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        De persoon regelt alles voor u. U behoudt het overzicht.
                      </p>
                    </div>
                  </div>
                </button>

                {otherMode !== null && (
                  <div className="pt-1">
                    <label htmlFor="delegate-name" className="mb-2 block text-sm font-semibold text-gray-900">
                      Naam van de persoon die helpt
                    </label>
                    <input
                      id="delegate-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Bijvoorbeeld: Lisa de Vries"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#007AC8] focus:outline-none focus:ring-1 focus:ring-[#007AC8]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
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
        {mode === 'self' && (
          <button
            type="button"
            onClick={onSelfContinue}
            className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD]"
          >
            Verder
          </button>
        )}
        {mode === 'other' && otherMode === 'together' && (
          <button
            type="button"
            disabled={!canSubmitDelegate}
            onClick={onTogether}
            className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Verder
          </button>
        )}
        {mode === 'other' && otherMode === 'delegate' && (
          <button
            type="button"
            disabled={!canSubmitDelegate}
            onClick={() => onDelegate(name.trim())}
            className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Uitnodigen
          </button>
        )}
      </div>
    </>
  );
}
