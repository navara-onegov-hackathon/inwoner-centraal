import {
  BEGELEIDING_LABELS,
  type BegeleidingsVoorkeur,
  type PostadresKeuze,
} from '../../../types/begeleiding';

interface ReviewStepProps {
  voorkeur: BegeleidingsVoorkeur;
  postadresKeuze: PostadresKeuze;
  onBack: () => void;
  onComplete: () => void;
}

const POSTADRES_LABELS: Record<PostadresKeuze, string> = {
  thuisadres: 'Post naar thuisadres doorgeven',
  huidige_situatie: 'Postadres ongewijzigd laten',
  later: 'Later beslissen',
};

export function ReviewStep({ voorkeur, postadresKeuze, onBack, onComplete }: ReviewStepProps) {
  return (
    <>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Controleer uw keuzes</h1>
        <p className="mb-6 text-sm text-gray-600">
          Zo starten we uw overzicht. Alles is later aan te passen.
        </p>

        <dl className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Begeleiding
            </dt>
            <dd className="mt-1 font-medium text-gray-900">{BEGELEIDING_LABELS[voorkeur.niveau]}</dd>
            {voorkeur.niveau === 'keuze' && voorkeur.zelfRegelenOrganisaties.length > 0 && (
              <dd className="mt-1 text-sm text-gray-600">
                Zelf regelen: {voorkeur.zelfRegelenOrganisaties.join(', ')}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Postadres
            </dt>
            <dd className="mt-1 font-medium text-gray-900">{POSTADRES_LABELS[postadresKeuze]}</dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-gray-600">
          Op uw overzicht ziet u vijf duidelijke onderdelen: wat u moet doen, wat op de achtergrond
          loopt, wat wij al deden, waar we op wachten, en wat afgerond is.
        </p>
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
          onClick={onComplete}
          className="flex-1 rounded-md bg-[#007AC8] py-3 text-sm font-semibold text-white hover:bg-[#0069AD]"
        >
          Naar uw overzicht
        </button>
      </div>
    </>
  );
}
