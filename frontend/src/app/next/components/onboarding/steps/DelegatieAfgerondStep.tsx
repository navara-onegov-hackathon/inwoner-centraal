import { CheckCircle2 } from 'lucide-react';
import type { DelegatieMode } from './DelegatieStep';

interface DelegatieAfgerondStepProps {
  delegateName: string;
  mode: DelegatieMode;
}

export function DelegatieAfgerondStep({ delegateName, mode }: DelegatieAfgerondStepProps) {
  const voornaam = delegateName.trim().split(/\s+/)[0] || delegateName;

  const bodyCopy =
    mode === 'together'
      ? (
          <>
            <strong>{voornaam}</strong> ontvangt een verzoek om via DigiD Machtigen samen met u het
            traject voort te zetten. Zodra de machtiging is afgerond, kunt u samen verder met uw
            stappenplan.
          </>
        )
      : (
          <>
            <strong>{voornaam}</strong> ontvangt een verzoek om via DigiD Machtigen het traject over
            te nemen. Zodra de machtiging is afgerond, kan {voornaam} verder met uw stappenplan.
          </>
        );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col items-center justify-center px-6 py-10 text-center">
      <CheckCircle2 className="mb-5 h-14 w-14 text-green-600" aria-hidden />
      <h1 className="mb-3 text-2xl font-bold text-gray-900">Verzoek verstuurd</h1>
      <p className="mb-8 max-w-sm text-base leading-relaxed text-gray-700">{bodyCopy}</p>
      <p className="mb-8 text-sm text-gray-500">
        Voor deze demo eindigt uw traject hier. In de pitch tonen we het volledige hoofdtraject via
        de voortgang van Truus.
      </p>
      <button
        type="button"
        className="rounded-md bg-[#007AC8] px-5 py-2.5 text-sm font-semibold text-white"
        aria-disabled="true"
      >
        Naar overzicht
      </button>
    </div>
  );
}
