import * as React from 'react';
import { CircleCheck, Circle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useOnboarding } from '../../../store/onboarding.store';
import type { AdapterId } from '../../../types';

const ADAPTERS: Array<{ id: AdapterId; name: string; hint: string }> = [
  { id: 'claude', name: 'Claude Code', hint: 'Runs `claude` — sign in with `claude login`.' },
  { id: 'codex', name: 'Codex', hint: 'Runs `codex` — sign in with `codex login`.' },
];

export function StepAdapter(): JSX.Element {
  const {
    detectedAdapters,
    selectedAdapter,
    adapterTested,
    detectAdapters,
    selectAdapter,
    testAdapter,
  } = useOnboarding();
  const [testing, setTesting] = React.useState(false);
  const [testError, setTestError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void detectAdapters();
  }, [detectAdapters]);

  const infoFor = (id: AdapterId) => detectedAdapters.find((a) => a.id === id);

  const handleTest = async (): Promise<void> => {
    setTesting(true);
    setTestError(null);
    try {
      const ok = await testAdapter();
      if (!ok) setTestError('Adapter test failed — check the CLI is installed and signed in.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg text-heading">Choose your adapter</h2>
      <p className="text-sm text-muted">
        Flow Agent drives an agentic CLI you already use. Pick one — it runs on this device
        using the CLI&apos;s own login. No API key needed.
      </p>

      <div className="flex flex-col gap-2">
        {ADAPTERS.map(({ id, name, hint }) => {
          const info = infoFor(id);
          const installed = info?.installed ?? false;
          const authed = info?.authenticated ?? false;
          const selected = selectedAdapter === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`adapter-card-${id}`}
              aria-pressed={selected}
              disabled={!installed}
              onClick={() => selectAdapter(id)}
              className={
                'flex items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors ' +
                (selected ? 'border-wire-hover bg-elevated' : 'border-wire bg-surface hover:border-wire-hover') +
                ' disabled:opacity-40 disabled:cursor-not-allowed'
              }
            >
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm text-heading">
                  {selected ? <CircleCheck size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
                  {name}
                </span>
                <span className="font-mono text-xs text-muted">{hint}</span>
              </span>
              <span className={`text-xs ${installed ? (authed ? 'text-go' : 'text-hold') : 'text-muted'}`}>
                {installed ? (authed ? 'Ready' : 'Sign-in needed') : 'Not installed'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={handleTest} disabled={testing || !selectedAdapter || adapterTested}>
          {testing ? 'Testing…' : adapterTested ? 'Tested' : 'Test adapter'}
        </Button>
        {adapterTested ? <span className="text-xs text-go">Adapter works</span> : null}
        {testError ? <span className="text-xs text-signal">{testError}</span> : null}
      </div>
    </div>
  );
}
