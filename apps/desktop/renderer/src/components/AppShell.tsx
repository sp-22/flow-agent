import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { SegmentedTabs } from './SegmentedTabs';
import { StatusDot } from './StatusDot';
import { useTheme } from '../store/theme.store';
import logo from '../assets/logo.png';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-screen flex-col bg-base">
      <header
        className="relative flex h-11 shrink-0 items-center border-b border-wire bg-base px-3"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* macOS traffic-light inset spacer */}
        <div className="w-[70px] shrink-0" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="WorkflowPilot Logo"
            className="h-[18px] w-[18px] shrink-0"
            style={{ filter: 'var(--logo-filter)' }}
          />
          <span className="font-display text-sm font-medium tracking-tight text-heading">
            WorkflowPilot
          </span>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <SegmentedTabs />
        </div>

        <div
          className="ml-auto flex shrink-0 items-center gap-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className="flex items-center gap-1.5" title="Proxy status">
            <StatusDot tone="go" title="Proxy" />
            <span className="font-mono text-xs text-muted">proxy</span>
          </div>
          <div className="flex items-center gap-1.5" title="Claude status">
            <StatusDot tone="go" title="Claude" />
            <span className="font-mono text-xs text-muted">claude</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-md border border-wire p-1.5 text-body transition-colors duration-150 ease-[var(--ease)] hover:border-wire-hover hover:text-heading"
          >
            {theme === 'dark' ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
