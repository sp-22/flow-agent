import * as React from 'react';

type Tone = 'neutral' | 'go' | 'hold' | 'signal';

export interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'text-muted bg-elevated border border-wire',
  go: 'text-go bg-[var(--go-bg)] border border-transparent',
  hold: 'text-hold bg-[var(--hold-bg)] border border-transparent',
  signal: 'text-signal bg-[var(--signal-bg)] border border-transparent',
};

const dotToneClasses: Record<Tone, string> = {
  neutral: 'bg-muted',
  go: 'bg-go',
  hold: 'bg-hold',
  signal: 'bg-signal',
};

export function Badge({ tone = 'neutral', dot = false, children }: BadgeProps): JSX.Element {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-xs leading-none',
        toneClasses[tone],
      ].join(' ')}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={['inline-block h-1.5 w-1.5 rounded-full', dotToneClasses[tone]].join(' ')}
        />
      )}
      {children}
    </span>
  );
}
