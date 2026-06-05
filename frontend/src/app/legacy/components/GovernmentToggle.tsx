interface GovernmentToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export function GovernmentToggle({ checked, onChange, id }: GovernmentToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-[4.5rem] shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#007AC8]' : 'bg-gray-400'
      }`}
    >
      <span
        className={`absolute text-[11px] font-semibold uppercase tracking-wide text-white transition-opacity ${
          checked ? 'left-2 opacity-100' : 'left-2 opacity-0'
        }`}
      >
        AAN
      </span>
      <span
        className={`absolute text-[11px] font-semibold uppercase tracking-wide text-white transition-opacity ${
          checked ? 'right-2 opacity-0' : 'right-2 opacity-100'
        }`}
      >
        UIT
      </span>
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[2.65rem]' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
