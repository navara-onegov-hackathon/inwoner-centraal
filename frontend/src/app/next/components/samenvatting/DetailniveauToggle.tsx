import { Switch } from '../../../legacy/components/ui/switch';

interface DetailniveauToggleProps {
  isUitgebreid: boolean;
  onToggle: () => void;
}

export function DetailniveauToggle({ isUitgebreid, onToggle }: DetailniveauToggleProps) {
  return (
    <section className="mb-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">Detailniveau</p>
        <p className="text-sm text-gray-600">
          {isUitgebreid
            ? 'Uitgebreide weergave — alle onderliggende gegevens zichtbaar'
            : 'Begeleide weergave — alleen wat u nu nodig heeft'}
        </p>
      </div>
      <label className="flex items-center gap-3 text-sm text-gray-700">
        <span>Toon alle details</span>
        <Switch checked={isUitgebreid} onCheckedChange={() => onToggle()} />
      </label>
    </section>
  );
}
