import * as React from 'react';
import { AlertCircle, CircleCheck, Circle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useOnboarding } from '../../../store/onboarding.store';
import type { AdapterId } from '../../../types';
import { AdapterLogo } from './AdapterLogo';

const ADAPTERS: Array<{ id: AdapterId; name: string; provider: string; command: string }> = [
  { id: 'claude', name: 'Claude Code', provider: 'Anthropic', command: 'claude' },
  { id: 'codex', name: 'Codex', provider: 'OpenAI', command: 'codex' },
];

interface AdapterError {
  title: string;
  detail: string;
  action: string;
}

export function formatAdapterError(raw: string, adapter: AdapterId): AdapterError {
  const name = adapter === 'claude' ? 'Claude Code' : 'Codex';

  if (/ENOENT|executable is missing/i.test(raw)) {
    return {
      title: `${name} installation is incomplete`,
      detail: 'The CLI launcher was found, but the executable it needs is missing.',
      action: `Reinstall ${name}, then test the adapter again.`,
    };
  }

  if (/auth|sign.?in|login|unauthorized|forbidden|403/i.test(raw)) {
    return {
      title: `${name} could not sign in`,
      detail: 'The CLI is installed, but its current login could not be used.',
      action: `Run \`${adapter} login\` in Terminal, then test again.`,
    };
  }

  if (/network|ECONN|ENET|timed? ?out|not on allow list/i.test(raw)) {
    return {
      title: `${name} could not connect`,
      detail: 'The CLI could not reach its service.',
      action: 'Check your connection or firewall, then test again.',
    };
  }

  const firstUsefulLine = raw
    .split(/\n| at ChildProcess| \{ errno:/)[0]
    ?.replace(new RegExp(`^${adapter} exited with code \\d+:?\\s*`, 'i'), '')
    .trim();

  return {
    title: `${name} test failed`,
    detail: firstUsefulLine || 'The CLI returned an unexpected error.',
    action: `Run \`${adapter} --version\` in Terminal, fix any reported issue, then test again.`,
  };
}

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
  const [testError, setTestError] = React.useState<AdapterError | null>(null);

  React.useEffect(() => {
    void detectAdapters();
  }, [detectAdapters]);

  const infoFor = (id: AdapterId) => detectedAdapters.find((a) => a.id === id);

  const handleTest = async (): Promise<void> => {
    setTesting(true);
    setTestError(null);
    try {
      const res = await testAdapter();
      if (!res.ok) {
        setTestError(
          formatAdapterError(
            res.error ?? 'The CLI returned an unexpected error.',
            selectedAdapter ?? 'claude'
          )
        );
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSelect = (id: AdapterId): void => {
    setTestError(null);
    selectAdapter(id);
  };

  const statusFor = (id: AdapterId): { label: string; tone: string } => {
    const info = infoFor(id);
    if (!info) return { label: 'Not detected', tone: 'text-muted' };
    if (!info.installed) return { label: 'Not detected', tone: 'text-muted' };
    if (!info.authenticated) return { label: 'Sign-in needed', tone: 'text-hold' };
    return { label: 'Ready', tone: 'text-go' };
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg text-heading">Choose your adapter</h2>
      <p className="text-sm text-muted">
        Flow Agent drives an agentic CLI you already use. Pick one — it runs on this device
        using the CLI&apos;s own login. No API key needed. Use <span className="text-body">Test adapter</span> to
        confirm it works.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ADAPTERS.map(({ id, name, provider, command }) => {
          const selected = selectedAdapter === id;
          const status = statusFor(id);
          return (
            <button
              key={id}
              type="button"
              data-testid={`adapter-card-${id}`}
              aria-pressed={selected}
              aria-label={`Select ${name} adapter`}
              onClick={() => handleSelect(id)}
              className={
                'relative flex min-h-40 flex-col items-center rounded-lg border px-4 py-5 text-center ' +
                'transition-colors duration-150 ease-[var(--ease)] ' +
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wire-hover ' +
                (selected
                  ? 'border-wire-hover bg-elevated text-heading'
                  : 'border-wire bg-surface text-body hover:border-wire-hover hover:bg-elevated')
              }
            >
              <span className="absolute right-3 top-3 text-muted">
                {selected ? (
                  <CircleCheck size={16} className="text-heading" aria-hidden="true" />
                ) : (
                  <Circle size={16} aria-hidden="true" />
                )}
              </span>

              <span
                className={
                  'mb-3 grid h-12 w-12 place-items-center rounded-md border transition-colors ' +
                  (selected ? 'border-wire-hover bg-surface text-heading' : 'border-wire bg-elevated text-body')
                }
              >
                <AdapterLogo adapter={id} className="h-7 w-7" />
              </span>

              <span className="text-sm font-medium text-heading">{name}</span>
              <span className="mt-1 font-mono text-[10px] text-muted">
                {provider} · {command}
              </span>
              <span className={`mt-auto pt-3 text-xs ${status.tone}`}>{status.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleTest} disabled={testing || !selectedAdapter || adapterTested}>
            {testing ? 'Testing adapter…' : adapterTested ? 'Adapter tested' : 'Test adapter'}
          </Button>
          {adapterTested ? (
            <span className="flex items-center gap-1.5 text-xs text-go">
              <CircleCheck size={14} aria-hidden="true" />
              Connection verified
            </span>
          ) : null}
        </div>

        {testError ? (
          <div
            role="alert"
            className="flex gap-3 rounded-md border border-signal/30 bg-[var(--signal-bg)] p-3"
          >
            <AlertCircle className="mt-0.5 shrink-0 text-signal" size={16} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-heading">{testError.title}</p>
              <p className="mt-1 text-xs leading-5 text-body">{testError.detail}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{testError.action}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
