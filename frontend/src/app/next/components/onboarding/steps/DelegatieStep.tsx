import { User, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import digidLogo from '../../../../../imports/logo-digid.png';

export type DelegatieMode = 'together' | 'takeover';

export interface DelegatieGegevens {
  naam: string;
  bsn: string;
  mode: DelegatieMode;
}

interface DelegatieStepProps {
  onSelfContinue: () => void;
  onDelegate: (gegevens: DelegatieGegevens) => void;
  onBack: () => void;
}

type Selection = 'self' | DelegatieMode;

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

export function DelegatieStep({ onSelfContinue, onDelegate, onBack }: DelegatieStepProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [naam, setNaam] = useState('');
  const [bsn, setBsn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const needsMachtiging = selection === 'together' || selection === 'takeover';
  const formValid = isValidDelegateForm(naam, bsn);

  const primaryLabel = (() => {
    if (needsMachtiging) {
      const name = voornaam(naam);
      return name ? `Machtig ${name} door DigiD` : 'Machtig door DigiD';
    }
    return 'Verder';
  })();

  const canContinue =
    selection === 'self' || (needsMachtiging && formValid && !submitting);

  const handleSelectionChange = (next: Selection) => {
    setSelection(next);
    setNaam('');
    setBsn('');
    setSubmitting(false);
  };

  const handlePrimary = () => {
    if (selection === 'self') {
      onSelfContinue();
      return;
    }

    if (!needsMachtiging || !formValid || submitting) return;

    setSubmitting(true);
    window.setTimeout(() => {
      onDelegate({
        naam: naam.trim(),
        bsn: bsn.replace(/\D/g, ''),
        mode: selection,
      });
    }, 900);
  };

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Wilt u dat iemand anders dit voor u regelt?
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Niet iedereen wil zelf alle stappen doorlopen. Kies wat het beste bij uw situatie past.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSelectionChange('self')}
            className={`w-full rounded-lg border p-4 text-left transition ${
              selection === 'self'
                ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 shrink-0 text-[#007AC8]" aria-hidden />
              <div>
                <p className="font-bold text-gray-900">Ik regel het zelf</p>
                <p className="mt-1 text-sm text-gray-600">
                  U heeft de regie en behoudt het overzicht.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectionChange('together')}
            className={`w-full rounded-lg border p-4 text-left transition ${
              selection === 'together'
                ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#007AC8]" aria-hidden />
              <div>
                <p className="font-bold text-gray-900">We doen het samen</p>
                <p className="mt-1 text-sm text-gray-600">
                  U doorloopt de stappen samen met iemand die u vertrouwt. U behoudt de controle.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectionChange('takeover')}
            className={`w-full rounded-lg border p-4 text-left transition ${
              selection === 'takeover'
                ? 'border-[#007AC8] bg-[#E8F4FC] ring-1 ring-[#007AC8]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#007AC8]" aria-hidden />
              <div>
                <p className="font-bold text-gray-900">Iemand anders neemt het over</p>
                <p className="mt-1 text-sm text-gray-600">
                  Machtig iemand via DigiD om het traject voor u voort te zetten.
                </p>
              </div>
            </div>
          </button>

          {needsMachtiging && (
            <div className="space-y-3 rounded-lg border border-[#007AC8]/30 bg-[#E8F4FC]/50 p-4">
              <p className="text-sm text-gray-700">
                Wie gaat u helpen? Geef nooit uw DigiD-inloggegevens direct aan een ander.
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
            needsMachtiging
              ? 'min-h-[47px] justify-between gap-3 border border-[#EDEDED] bg-white px-4 text-left text-gray-900 hover:bg-gray-50'
              : 'justify-center bg-[#007AC8] text-white hover:bg-[#0069AD]'
          }`}
        >
          <span className={needsMachtiging ? 'min-w-0 flex-1' : undefined}>
            {submitting ? 'Verzoek versturen…' : primaryLabel}
          </span>
          {needsMachtiging && !submitting && (
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
