import { useAppVersion } from './shared/hooks/useAppVersion';
import { LegacyApp } from './legacy/LegacyApp';
import { NextApp } from './next/NextApp';

export default function App() {
  const { version, setVersion } = useAppVersion();

  if (version === 'legacy') {
    return <LegacyApp version={version} onVersionChange={setVersion} />;
  }

  return <NextApp version={version} onVersionChange={setVersion} />;
}
