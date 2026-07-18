import * as React from 'react';
import { Button } from '../../../components/Button';
import { useOnboarding } from '../../../store/onboarding.store';

export function StepApiKey(): JSX.Element {
  const { apiKeyVerified, verifyApiKey } = useOnboarding();
  const [key, setKey] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);

  const handleVerify = async (): Promise<void> => {
    setVerifying(true);
    try {
      await verifyApiKey(key);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg text-heading">Connect your API key</h2>
      <p className="text-sm text-muted">
        WorkflowPilot uses this key to turn recordings into automations. It stays on this
        device.
      </p>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Paste your API key"
        className="h-9 rounded-md border border-wire bg-elevated px-3 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-wire-hover"
      />
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleVerify}
          disabled={verifying || !key || apiKeyVerified}
        >
          {verifying ? 'Verifying…' : apiKeyVerified ? 'Verified' : 'Verify'}
        </Button>
        {apiKeyVerified ? <span className="text-xs text-go">Key verified</span> : null}
      </div>
    </div>
  );
}
