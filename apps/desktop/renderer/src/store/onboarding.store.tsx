import * as React from 'react';

const STORAGE_KEY = 'workflowpilot:onboarding-complete';
const VERIFY_DELAY_MS = 600;

export interface OnboardingContextValue {
  complete: boolean;
  apiKeyVerified: boolean;
  certTrusted: boolean;
  verifyApiKey(key: string): Promise<boolean>;
  verifyCert(): Promise<boolean>;
  finish(): void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | undefined>(undefined);

function readStoredComplete(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // localStorage unavailable (e.g. restrictive test/runtime environment) — degrade to false.
    return false;
  }
}

function writeStoredComplete(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // localStorage unavailable — degrade to in-memory only.
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [complete, setComplete] = React.useState<boolean>(() => readStoredComplete());
  const [apiKeyVerified, setApiKeyVerified] = React.useState(false);
  const [certTrusted, setCertTrusted] = React.useState(false);

  const verifyApiKey = React.useCallback((_key: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        setApiKeyVerified(true);
        resolve(true);
      }, VERIFY_DELAY_MS);
    });
  }, []);

  const verifyCert = React.useCallback((): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        setCertTrusted(true);
        resolve(true);
      }, VERIFY_DELAY_MS);
    });
  }, []);

  const finish = React.useCallback(() => {
    setComplete(true);
    writeStoredComplete();
  }, []);

  const value = React.useMemo<OnboardingContextValue>(
    () => ({ complete, apiKeyVerified, certTrusted, verifyApiKey, verifyCert, finish }),
    [complete, apiKeyVerified, certTrusted, verifyApiKey, verifyCert, finish]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
