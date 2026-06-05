import { useMemo, useState } from 'react';
import {
  situatieCategorieen,
  situatieVeranderingen,
  type SituatieCategorieId,
} from '../../data/situatieVeranderingen';
import { SituatieVeranderingCard } from '../wat-betekent/SituatieVeranderingCard';

interface WatBetekentPageProps {
  onNavigate?: (section: string) => void;
}

export function WatBetekentPage({ onNavigate }: WatBetekentPageProps) {
  const [activeCategorie, setActiveCategorie] = useState<SituatieCategorieId>('alle');

  const gefilterd = useMemo(
    () =>
      activeCategorie === 'alle'
        ? situatieVeranderingen
        : situatieVeranderingen.filter((item) => item.categorie === activeCategorie),
    [activeCategorie],
  );

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          className="hover:text-[#007AC8] hover:underline"
        >
          Overzicht
        </button>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold text-gray-900">Wat betekent dit voor u?</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[2rem] font-bold leading-tight text-gray-900">
          Wat betekent dit voor u?
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">
          Na het overlijden van uw partner veranderen er dingen in uw inkomen, verzekeringen, belasting
          en andere regelingen. Hier ziet u per onderwerp hoe uw situatie was — en wat er vanaf nu
          anders is of kan worden.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-[#007AC8]/15 bg-[#E8F4FC]/40 px-5 py-4">
        <p className="text-sm leading-relaxed text-gray-700">
          <span className="font-semibold text-gray-900">Voorbeeld voor Truus de Vries-Bakker.</span>{' '}
          Dit is een statisch overzicht ter illustratie. In een latere versie koppelen we dit aan uw
          eigen gegevens.
        </p>
      </div>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter op onderwerp"
      >
        {situatieCategorieen.map((categorie) => {
          const active = activeCategorie === categorie.id;
          return (
            <button
              key={categorie.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategorie(categorie.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#007AC8] text-white'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {categorie.label}
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {gefilterd.length} {gefilterd.length === 1 ? 'onderwerp' : 'onderwerpen'}
      </p>

      <div className="space-y-4">
        {gefilterd.map((item) => (
          <SituatieVeranderingCard key={item.id} item={item} />
        ))}
      </div>

      {gefilterd.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-600">
          Geen onderwerpen in deze categorie.
        </div>
      )}

      <div className="mt-8 rounded-lg border border-[#007AC8]/20 bg-[#E8F4FC]/60 px-5 py-4">
        <p className="text-sm text-gray-800">
          Moet u ergens actie op ondernemen?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('stappenplan')}
            className="font-semibold text-[#007AC8] underline-offset-2 hover:underline"
          >
            Bekijk uw stappenplan
          </button>
          {' '}voor concrete taken en deadlines.
        </p>
      </div>
    </div>
  );
}
