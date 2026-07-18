import * as React from 'react';
import { GlobalSidebar } from './GlobalSidebar';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="relative flex h-screen bg-base">
      <GlobalSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
