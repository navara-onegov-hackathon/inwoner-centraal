import type { AppVersion } from '../hooks/useAppVersion';

interface VersionToggleProps {
  version: AppVersion;
  onVersionChange: (version: AppVersion) => void;
}

export function VersionToggle({ version, onVersionChange }: VersionToggleProps) {
  const isNext = version === 'next';

  return (
    <div className="inline-flex flex-col gap-1">
      <span className="pl-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        Weergave
      </span>

      <div className="inline-flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <span
          className={`min-w-[2.25rem] text-right text-xs transition-all duration-200 ${
            !isNext ? 'font-semibold text-[#154273]' : 'font-normal text-gray-400'
          }`}
        >
          Vorig
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={isNext}
          aria-label={`Weergave: ${isNext ? 'nieuwe versie' : 'vorige versie'}`}
          onClick={() => onVersionChange(isNext ? 'legacy' : 'next')}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AC8] ${
            isNext ? 'bg-[#154273]' : 'bg-gray-300/90'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 block h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out ${
              isNext ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>

        <span
          className={`min-w-[2.25rem] text-xs transition-all duration-200 ${
            isNext ? 'font-semibold text-[#154273]' : 'font-normal text-gray-400'
          }`}
        >
          Nieuw
        </span>
      </div>
    </div>
  );
}
