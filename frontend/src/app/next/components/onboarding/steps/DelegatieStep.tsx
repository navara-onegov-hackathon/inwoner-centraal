import { User, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import digidLogo from '../../../../../imports/logo-digid.png';

export interface DelegatieGegevens {
  naam: string;
  bsn: string;
}

interface DelegatieStepProps {
  onSelfContinue: () => void;
  onTogether: () => void;
  onDelegate: (gegevens: DelegatieGegevens) => void;
  onBack: () => void;
}

function isValidBsn(bsn: string) {
  return /^\d{9}$/.test(bsn.replace(/\D/g, ''));
}

function isValidDelegateForm(naam: string, bsn: string) {
  return naam.trim().length >= 2 && isValidBsn(bsn);
}

function voornaam(naam: string) {
  const trimmed = naam.trim();
  return trimmed.split(/\s+/)[0] || '';
}

export function DelegatieStep({
  onSelfContinue,
  onTogether,
  onDelegate,
  onBack,
}: DelegatieStepProps) {
  const [mode, setMode] = useState<'self' | 'other' | null>(null);
  const [otherMode, setOtherMode] = useState<'together' | 'delegate' | null>(null);
  const [naam, setNaam] = useState('');
  const [bsn, setBsn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formValid = isValidDelegateForm(naam, bsn);

  const primaryLabel = (() => {
    if (mode === 'other' && otherMode === 'delegate') {
      const name = voornaam(naam);
      return name ? `Machtig ${name} door DigiD` : 'Machtig door DigiD';
    }
    return 'Verder';
  })();

  const canContinue =
    mode === 'self' ||
    (mode === 'other' && otherMode === 'together') ||
    (mode === 'other' && otherMode === 'delegate' && formValid && !submitting);

  const handlePrimary = () => {
    if (mode === 'self') {
      onSelfContinue();
      return;
    }

    if (mode !== 'other' || otherMode === null || submitting) return;

    if (otherMode === 'together') {
      onTogether();
      return;
    }

    if (!formValid) return;

    setSubmitting(true);
    window.setTimeout(() => {
      onDelegate({ naam: naam.trim(), bsn: bsn.replace(/\D/g, '') });
    }, 900);
  };

  const handleModeChange = (next: 'self' | 'other') => {
    setMode(next);
    setOtherMode(null);
    setNaam('');
    setBsn('');
    setSubmitting(false);
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
                  ? 'rounded-b-none border-b-0 border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
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
              <div className="space-y-3 rounded-b-lg border border-t-0 border-[#007AC8] bg-[#E8F4FC] p-4">
                <button
                  type="button"
                  onClick={() => {
                    setOtherMode('together');
                    setSubmitting(false);
                  }}
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
                        Machtig iemand via DigiD om het traject voort te zetten.
                      </p>
                    </div>
                  </div>
                </button>

                {otherMode === 'delegate' && (
                  <div className="space-y-3 pt-1">
                    <p className="text-sm text-gray-700">
                      Wie gaat u helpen? Geef nooit uw
                      DigiD-inloggegevens direct aan een ander.
                    </p>
                    <div>
                      <label
                        htmlFor="delegate-name"
                        className="mb-1 block text-xs font-semibold text-gray-700"
                      >
                        Naam van de persoon die u machtigt
                      </label>
                      <input
                        id="delegate-name"
                        type="text"
                        value={naam}
                        onChange={(e) => setNaam(e.target.value)}
                        placeholder="Bijvoorbeeld: Lisa de Vries"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#007AC8] focus:outline-none focus:ring-1 focus:ring-[#007AC8]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="delegate-bsn"
                        className="mb-1 block text-xs font-semibold text-gray-700"
                      >
                        Burgerservicenummer (BSN) van de gemachtigde
                      </label>
                      <input
                        id="delegate-bsn"
                        type="text"
                        inputMode="numeric"
                        value={bsn}
                        onChange={(e) => setBsn(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="123456789"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm tracking-wide focus:border-[#007AC8] focus:outline-none focus:ring-1 focus:ring-[#007AC8]"
                        aria-invalid={bsn.length > 0 && !isValidBsn(bsn)}
                      />
                      {bsn.length > 0 && !isValidBsn(bsn) && (
                        <p className="mt-1 text-xs text-red-600">Voer een geldig BSN in (9 cijfers).</p>
                      )}
                    </div>
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
          disabled={submitting}
          className="flex-1 rounded-md border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Terug
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={handlePrimary}
          className={`flex flex-1 items-center rounded-md py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
            mode === 'other' && otherMode === 'delegate'
              ? 'min-h-[47px] justify-between gap-3 border border-[#EDEDED] bg-white px-4 text-left text-gray-900 hover:bg-gray-50'
              : 'justify-center bg-[#007AC8] text-white hover:bg-[#0069AD]'
          }`}
        >
          <span className={mode === 'other' && otherMode === 'delegate' ? 'min-w-0 flex-1' : undefined}>
            {submitting ? 'Verzoek versturen…' : primaryLabel}
          </span>
          {mode === 'other' && otherMode === 'delegate' && !submitting && (
            <img
              src={digidLogo}
              alt=""
              className="h-8 w-8 shrink-0 rounded object-contain"
              aria-hidden
            />
          )}
        </button>
      </div>
    </>
  );
}
