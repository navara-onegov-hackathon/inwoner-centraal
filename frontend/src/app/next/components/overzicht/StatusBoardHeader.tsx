import type { SamenvattingCounts } from '../../types/overzicht';

const LANES = [
  { key: 'actie_van_u' as const, label: 'Actie van u', color: 'text-red-700 bg-red-50' },
  { key: 'op_achtergrond' as const, label: 'Op de achtergrond', color: 'text-[#007AC8] bg-blue-50' },
  {
    key: 'geregeld_door_ons' as const,
    label: 'Geregeld door ons',
    color: 'text-green-800 bg-green-50',
  },
  {
    key: 'wachten_op_organisatie' as const,
    label: 'Wachten op organisatie',
    color: 'text-amber-900 bg-amber-50',
  },
  { key: 'afgerond' as const, label: 'Afgerond', color: 'text-gray-700 bg-gray-100' },
];

interface StatusBoardHeaderProps {
  counts: SamenvattingCounts;
}

export function StatusBoardHeader({ counts }: StatusBoardHeaderProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="mb-8 grid gap-2 sm:grid-cols-5">
      {LANES.map((lane) => (
        <button
          key={lane.key}
          type="button"
          onClick={() => scrollTo(`lane-${lane.key}`)}
          className={`rounded-lg px-3 py-3 text-left transition hover:opacity-90 ${lane.color}`}
        >
          <p className="text-xs font-medium opacity-80">{lane.label}</p>
          <p className="text-2xl font-bold">{counts[lane.key]}</p>
        </button>
      ))}
    </section>
  );
}

export { LANES };
