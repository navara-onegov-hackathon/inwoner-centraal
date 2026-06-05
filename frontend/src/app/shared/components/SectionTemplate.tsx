import { sectionLabels } from '../config/sectionConfig';

interface SectionTemplateProps {
  sectionId: string;
  onNavigate?: (section: string) => void;
}

export function SectionTemplate({ sectionId, onNavigate }: SectionTemplateProps) {
  const title = sectionLabels[sectionId] ?? sectionId;

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {sectionId !== 'home' && (
        <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="hover:text-[#007AC8] hover:underline"
          >
            Home
          </button>
          <span className="mx-2">&gt;</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </nav>
      )}

      <h1 className="mb-8 text-[2rem] font-bold leading-tight tracking-tight text-gray-900">
        {title}
      </h1>

      <div className="rounded-lg border border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
        <p className="text-[15px] font-semibold text-gray-900">Deze pagina is nog in ontwikkeling</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
          Informatie voor {title.toLowerCase()} wordt binnenkort toegevoegd.
        </p>
      </div>
    </div>
  );
}
