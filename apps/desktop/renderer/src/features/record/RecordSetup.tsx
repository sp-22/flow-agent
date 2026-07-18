import * as React from 'react';
import { subscribeMicLevel } from '../../services/recording.service';
import { Button } from '../../components/Button';

export interface RecordSetupProps {
  name: string;
  onNameChange(name: string): void;
  onStart(): void;
  proxyDown?: boolean;
}

export function RecordSetup({
  name,
  onNameChange,
  onStart,
  proxyDown = false,
}: RecordSetupProps): JSX.Element {
  const [micLevel, setMicLevel] = React.useState(0);
  const [proxyFixed, setProxyFixed] = React.useState(false);
  const micOk = micLevel > 0;
  const effectiveProxyDown = proxyDown && !proxyFixed;

  React.useEffect(() => {
    const unsubscribe = subscribeMicLevel((level) => {
      setMicLevel(level);
    });
    return unsubscribe;
  }, []);

  const canStart = micOk && !effectiveProxyDown;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-heading">Record a workflow</h1>
        <p className="text-sm text-muted">
          Name it, then walk through the task out loud. WorkflowPilot will turn what you do
          into a runnable automation.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Workflow name</span>
        <input
          className="h-9 rounded-md border border-wire bg-surface px-3 text-sm text-heading outline-none focus-visible:border-wire-hover"
          placeholder="e.g. Triage new GitHub issues"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-2 rounded-md border border-wire bg-surface p-4">
        <span className="text-xs text-muted">Mic check</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full bg-go transition-[width] duration-150 ease-[var(--ease)]"
              style={{ width: `${Math.round(micLevel * 100)}%` }}
            />
          </div>
          {micOk ? (
            <span className="whitespace-nowrap text-xs text-go">✓ Sounds good</span>
          ) : (
            <span className="whitespace-nowrap text-xs text-muted">Listening…</span>
          )}
        </div>
      </div>

      <p className="rounded-md border border-wire bg-surface p-4 text-sm text-body">
        Narrate what you're doing as you go — say which app you're in, what you're clicking,
        and why. The more you explain, the better the automation.
      </p>

      {effectiveProxyDown ? (
        <p className="text-xs text-signal">
          Local proxy is unreachable — recording needs it to capture requests.{' '}
          <button
            type="button"
            onClick={() => setProxyFixed(true)}
            className="underline decoration-dotted underline-offset-2 hover:text-heading"
          >
            Proxy not running — fix
          </button>
        </p>
      ) : null}

      {micOk ? (
        <Button variant="primary" size="lg" disabled={!canStart} onClick={onStart}>
          Start Recording
        </Button>
      ) : (
        <Button variant="primary" size="lg" disabled>
          Checking mic…
        </Button>
      )}
    </div>
  );
}
