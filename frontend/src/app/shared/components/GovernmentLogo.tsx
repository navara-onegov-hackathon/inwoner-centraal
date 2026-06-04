import logoSvg from '../../../imports/logo-rijksoverheid-wapen.svg';

interface GovernmentLogoProps {
  className?: string;
}

export function GovernmentLogo({ className = '' }: GovernmentLogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center bg-[#154273] ${className}`}
      style={{ width: 48, height: 64 }}
      aria-label="Rijksoverheid"
    >
      <img src={logoSvg} alt="" className="h-8 w-10" />
    </div>
  );
}
