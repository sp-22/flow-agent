import * as React from 'react';
import { CircleCheck, Circle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useOnboarding } from '../../../store/onboarding.store';

const INSTALL_COMMAND = 'workflowpilot cert install --trust';

export function StepProxyCert(): JSX.Element {
  const { certTrusted, verifyCert } = useOnboarding();
  const [verifying, setVerifying] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleVerify = async (): Promise<void> => {
    setVerifying(true);
    try {
      await verifyCert();
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable in this environment — no-op.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg text-heading">Install &amp; trust certificate</h2>
      <p className="text-sm text-muted">
        WorkflowPilot records network calls through a local proxy. Run this command once so
        requests aren't blocked, then verify below.
      </p>
      <div className="flex items-center gap-2 text-sm">
        <span className={`flex items-center gap-1.5 ${certTrusted ? 'text-go' : 'text-muted'}`}>
          {certTrusted ? (
            <CircleCheck size={14} aria-hidden="true" />
          ) : (
            <Circle size={14} aria-hidden="true" />
          )}
          {certTrusted ? 'Proxy trusted' : 'Proxy not yet trusted'}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-wire bg-elevated px-3 py-2 font-mono text-xs text-body">
        <code className="flex-1 overflow-x-auto">{INSTALL_COMMAND}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-muted hover:text-heading"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleVerify}
          disabled={verifying || certTrusted}
        >
          {verifying ? 'Verifying…' : certTrusted ? 'Verified' : 'Verify'}
        </Button>
        {certTrusted ? <span className="text-xs text-go">Certificate verified</span> : null}
      </div>
    </div>
  );
}
