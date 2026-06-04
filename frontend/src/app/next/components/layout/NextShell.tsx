import type { ReactNode } from 'react';

interface NextShellProps {
  children: ReactNode;
}

export function NextShell({ children }: NextShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="relative z-0 min-w-0 flex-1 overflow-y-auto bg-[#f7f7f7]">{children}</main>
    </div>
  );
}
