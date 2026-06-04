import logoSvg from '../../../imports/logo-rijksoverheid-wapen.svg';

interface GovernmentLogoProps {
  className?: string;
}

export function GovernmentLogo({ className = '' }: GovernmentLogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center bg-[#154273] shadow-md ${className}`}
      style={{ width: 44, height: 58 }}
      aria-label="Rijksoverheid"
    >
      <img src={logoSvg} alt="" className="h-7 w-9" />
    </div>
  );
}
