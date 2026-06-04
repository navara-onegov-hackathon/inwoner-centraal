import { CheckCircle2 } from 'lucide-react';

interface DelegatieAfgerondStepProps {
  delegateName: string;
  onRestartDemo: () => void;
}

export function DelegatieAfgerondStep({ delegateName, onRestartDemo }: DelegatieAfgerondStepProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-lg flex-col items-center justify-center px-6 py-10 text-center">
      <CheckCircle2 className="mb-6 h-16 w-16 text-green-600" aria-hidden />
      <h1 className="mb-3 text-2xl font-bold text-gray-900">Overdracht geregeld</h1>
      <p className="mb-2 text-base leading-relaxed text-gray-700">
        We hebben <strong>{delegateName}</strong> uitgenodigd om het verdere traject over te nemen.
        Zij ontvangen dezelfde begeleide stappen en kunnen daarna het overzicht inzien.
      </p>
      <p className="mb-8 text-sm text-gray-500">
        Voor deze demo eindigt uw traject hier. In de pitch tonen we het volledige hoofdtraject via
        de voortgang van Truus.
      </p>
      <button
        type="button"
        onClick={onRestartDemo}
        className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Demo opnieuw starten
      </button>
    </div>
  );
}
