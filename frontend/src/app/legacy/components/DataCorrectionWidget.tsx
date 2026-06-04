import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

type RequiredInput = {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  prefill: string;
};

type SourceDetail = {
  source: string;
  source_label: string;
  value: string | null;
  status: string;
};

type Discrepancy = {
  id: string;
  field: string;
  label: string;
  type: string;
  issue: string;
  explanation: string;
  sources: SourceDetail[];
  required_input: RequiredInput;
};

type ReconciliationResponse = {
  discrepancies: Discrepancy[];
  has_discrepancies: boolean;
};

type SubmitResponse = {
  message?: string;
  errors?: Record<string, string>;
};

export function DataCorrectionWidget() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadReconciliation() {
      try {
        const response = await fetch('/api/data-reconciliation/');
        if (!response.ok) {
          throw new Error('De gegevens konden niet worden opgehaald.');
        }
        const data = (await response.json()) as ReconciliationResponse;
        if (cancelled) {
          return;
        }

        setDiscrepancies(data.discrepancies ?? []);
        setValues(
          Object.fromEntries(
            (data.discrepancies ?? []).map((item) => [
              item.required_input.name,
              item.required_input.prefill ?? '',
            ]),
          ),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Er ging iets mis.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReconciliation();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    setSubmittedMessage('');

    try {
      const response = await fetch('/api/data-reconciliation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ corrections: values }),
      });
      const data = (await response.json()) as SubmitResponse;

      if (!response.ok) {
        setFieldErrors(data.errors ?? {});
        throw new Error('Controleer de ingevulde gegevens.');
      }

      setSubmittedMessage(
        data.message ?? 'Dank u. Uw gegevens zijn doorgestuurd naar de betrokken organisaties.',
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Versturen is niet gelukt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-10 overflow-hidden border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-[#E8F4FC]">
          <CardTitle className="text-xl font-bold text-gray-900">Uw gegevens worden gecontroleerd</CardTitle>
          <p className="text-sm leading-relaxed text-gray-700">
            We kijken of de gegevens van de betrokken organisaties met elkaar overeenkomen.
          </p>
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex items-center gap-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#007AC8]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Een moment geduld</p>
              <p className="text-sm text-gray-700">Dit kan enkele seconden duren.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!discrepancies.length && !error) {
    return null;
  }

  return (
    <Card className="mb-10 overflow-hidden border-[#007AC8]/30 bg-white shadow-sm">
      <CardHeader className="border-b border-[#DAEAF6] bg-[#E8F4FC]">
        <CardTitle className="text-xl font-bold text-gray-900">Er mist nog wat informatie</CardTitle>
        <p className="text-sm leading-relaxed text-gray-700">
          We hebben gezien dat niet alle betrokken organisaties dezelfde gegevens hebben. Hieronder
          ziet u precies wat er nodig is en waarom. U hoeft dit maar een keer aan te vullen.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 py-6">
        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Niet alles is gelukt</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {submittedMessage ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Uw gegevens zijn ontvangen</AlertTitle>
              <AlertDescription>{submittedMessage}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {discrepancies.map((item) => (
              <section key={item.id} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">{item.issue}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.explanation}</p>
                </div>

                <div className="mb-4 rounded-md bg-gray-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-gray-900">Waar komt dit vandaan?</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {item.sources.map((source) => (
                      <li key={`${item.id}-${source.source}`}>
                        <span className="font-semibold">{source.source_label}:</span>{' '}
                        {source.value || 'nog niet bekend'}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="max-w-xl space-y-2">
                  <Label htmlFor={item.required_input.name}>{item.required_input.label}</Label>
                  <Input
                    id={item.required_input.name}
                    name={item.required_input.name}
                    value={values[item.required_input.name] ?? ''}
                    placeholder={item.required_input.placeholder}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [item.required_input.name]: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(fieldErrors[item.required_input.name])}
                    autoComplete={item.field === 'address' ? 'street-address' : 'off'}
                  />
                  {fieldErrors[item.required_input.name] && (
                    <p className="text-sm text-red-700">{fieldErrors[item.required_input.name]}</p>
                  )}
                </div>
              </section>
            ))}

            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#007AC8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0069AD]"
            >
              {submitting
                ? 'We geven uw gegevens door...'
                : 'Gegevens een keer doorgeven aan alle betrokken organisaties'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
