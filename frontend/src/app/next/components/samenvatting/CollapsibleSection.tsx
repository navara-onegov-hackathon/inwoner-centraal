import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-5">{children}</div>}
    </section>
  );
}
