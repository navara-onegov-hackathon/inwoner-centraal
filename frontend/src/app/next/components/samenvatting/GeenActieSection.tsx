import type { GeenActieItem } from '../../types/overzicht';
import { CollapsibleSection } from './CollapsibleSection';

interface GeenActieSectionProps {
  items: GeenActieItem[];
  defaultOpen?: boolean;
  isUitgebreid: boolean;
}

export function GeenActieSection({ items, defaultOpen = false, isUitgebreid }: GeenActieSectionProps) {
  if (items.length === 0) return null;

  return (
    <CollapsibleSection title="Geen actie nodig" defaultOpen={defaultOpen}>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="font-medium text-gray-900">
              {item.organisatie} — {item.titel}
            </p>
            {isUitgebreid && (
              <p className="mt-1 text-sm text-gray-500">Verzonden op {formatDate(item.verzonden_op)}</p>
            )}
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
