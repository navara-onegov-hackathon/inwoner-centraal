import type { VerwachtItem } from '../../types/overzicht';
import { CollapsibleSection } from './CollapsibleSection';

interface VerwachtSectionProps {
  items: VerwachtItem[];
  defaultOpen?: boolean;
}

export function VerwachtSection({ items, defaultOpen = false }: VerwachtSectionProps) {
  if (items.length === 0) return null;

  return (
    <CollapsibleSection title="Verwacht binnenkort" defaultOpen={defaultOpen}>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-gray-100 bg-white px-4 py-3">
            <p className="font-medium text-gray-900">
              {item.organisatie} — {item.titel}
            </p>
            <p className="mt-1 text-sm text-gray-600">{item.toelichting}</p>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
