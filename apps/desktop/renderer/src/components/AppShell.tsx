import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { GlobalSidebar } from './GlobalSidebar';
import { useTheme } from '../store/theme.store';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [collapsed, setCollapsed] = React.useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div className="relative flex h-screen bg-base">
      <GlobalSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      <main className="flex-1 overflow-auto">{children}</main>
      <button
        type="button"
        onClick={toggle}
        aria-label="Toggle theme"
        title="Toggle theme"
        className="absolute right-3 top-2 z-20 flex items-center rounded-md border border-wire bg-base p-1.5 text-body transition-colors hover:border-wire-hover hover:text-heading motion-reduce:transition-none"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {theme === 'dark' ? (
          <Sun size={16} aria-hidden="true" />
        ) : (
          <Moon size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
