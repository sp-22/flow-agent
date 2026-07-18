type Tone = 'go' | 'hold' | 'signal' | 'neutral';

export interface StatusDotProps {
  tone: Tone;
  title?: string;
}

const toneClasses: Record<Tone, string> = {
  go: 'bg-go',
  hold: 'bg-hold',
  signal: 'bg-signal',
  neutral: 'bg-muted',
};

export function StatusDot({ tone, title }: StatusDotProps): JSX.Element {
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      title={title}
      className={['inline-block h-1.5 w-1.5 shrink-0 rounded-full', toneClasses[tone]].join(' ')}
    />
  );
}
