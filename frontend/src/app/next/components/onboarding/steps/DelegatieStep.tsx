import { User, Users } from 'lucide-react';
import { useState } from 'react';
import digidLogo from '../../../../../imports/logo-digid.png';

export interface DelegatieGegevens {
  naam: string;
  bsn: string;
}

interface DelegatieStepProps {
  onSelfContinue: () => void;
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

export function DelegatieStep({ onSelfContinue, onDelegate, onBack }: DelegatieStepProps) {
  const [mode, setMode] = useState<'self' | 'other' | null>(null);
  const [naam, setNaam] = useState('');
  const [bsn, setBsn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formValid = isValidDelegateForm(naam, bsn);

  const primaryLabel = (() => {
    if (mode !== 'other') return 'Verder';
    const name = voornaam(naam);
    return name ? `Machtig ${name} door DigiD` : 'Machtig door DigiD';
  })();

  const canContinue =
    mode === 'self' || (mode === 'other' && formValid && !submitting);

  const handlePrimary = () => {
    if (mode === 'self') {
      onSelfContinue();
      return;
    }
    if (mode !== 'other' || !formValid || submitting) return;

    setSubmitting(true);
    window.setTimeout(() => {
      onDelegate({ naam: naam.trim(), bsn: bsn.replace(/\D/g, '') });
    }, 900);
  };

  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Wilt u dat iemand anders verder helpt?
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          Niet iedereen wil zelf alle stappen doorlopen. U kunt iemand vertrouwd — bijvoorbeeld een
          kind of familielid — de verdere regeling laten overnemen.
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
                  Machtig iemand via DigiD Machtigen om het traject voort te zetten.
                </p>
              </div>
            </div>
          </button>
        </div>

        {mode === 'other' && (
          <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              Vraag een machtigingscode aan voor de persoon die het overneemt. Geef nooit uw
              DigiD-inloggegevens direct aan een ander.
            </p>
            <div>
              <label htmlFor="delegate-name" className="mb-1 block text-xs font-semibold text-gray-700">
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
              <label htmlFor="delegate-bsn" className="mb-1 block text-xs font-semibold text-gray-700">
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
            mode === 'other'
              ? 'min-h-[47px] justify-between gap-3 border border-[#EDEDED] bg-white px-4 text-left text-gray-900 hover:bg-gray-50'
              : 'justify-center bg-[#007AC8] text-white hover:bg-[#0069AD]'
          }`}
        >
          <span className={mode === 'other' ? 'min-w-0 flex-1' : undefined}>
            {submitting ? 'Verzoek versturen…' : primaryLabel}
          </span>
          {mode === 'other' && !submitting && (
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
