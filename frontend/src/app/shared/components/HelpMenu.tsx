import { Phone } from 'lucide-react';

const HELP_PHONE_LABEL = '0800 - 1234';
const HELP_PHONE_HREF = 'tel:08001234';

export function HelpMenu() {
  return (
    <a
      href={HELP_PHONE_HREF}
      className="flex items-center gap-2 rounded-md border border-[#007AC8]/30 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-[#E8F4FC]"
      aria-label={`Bel voor hulp: ${HELP_PHONE_LABEL}`}
    >
      <Phone className="h-4 w-4 text-[#007AC8]" aria-hidden />
      <span>Kunnen wij u helpen?</span>
      <span className="hidden whitespace-nowrap sm:inline">{HELP_PHONE_LABEL}</span>
    </a>
  );
}
