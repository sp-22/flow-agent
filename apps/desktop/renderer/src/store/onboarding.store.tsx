import * as React from 'react';
import type { AdapterId, AdapterInfo } from '../types';
import {
  detectAdapters as detectAdaptersSvc,
  testAdapter as testAdapterSvc,
  setSelectedAdapter as persistSelectedAdapter,
} from '../services/adapter.service';

const STORAGE_KEY = 'workflowpilot:onboarding-complete';
const VERIFY_DELAY_MS = 600;

export interface OnboardingContextValue {
  complete: boolean;
  detectedAdapters: AdapterInfo[];
  selectedAdapter: AdapterId | null;
  adapterTested: boolean;
  adapterReady: boolean;
  certTrusted: boolean;
  detectAdapters(): Promise<void>;
  selectAdapter(id: AdapterId): void;
  testAdapter(): Promise<boolean>;
  verifyCert(): Promise<boolean>;
  finish(): void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | undefined>(undefined);

function readStoredComplete(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
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
  const [detectedAdapters, setDetectedAdapters] = React.useState<AdapterInfo[]>([]);
  const [selectedAdapter, setSelectedAdapter] = React.useState<AdapterId | null>(null);
  const [adapterTested, setAdapterTested] = React.useState(false);
  const [certTrusted, setCertTrusted] = React.useState(false);

  const detectAdapters = React.useCallback(async (): Promise<void> => {
    const infos = await detectAdaptersSvc();
    setDetectedAdapters(infos);
    setSelectedAdapter((current) => {
      if (current) return current;
      const preferred = infos.find((a) => a.installed && a.authenticated) ?? infos.find((a) => a.installed);
      if (preferred) {
        persistSelectedAdapter(preferred.id);
        return preferred.id;
      }
      return null;
    });
  }, []);

  const selectAdapter = React.useCallback((id: AdapterId) => {
    setSelectedAdapter(id);
    setAdapterTested(false);
    persistSelectedAdapter(id);
  }, []);

  const testAdapter = React.useCallback(async (): Promise<boolean> => {
    if (!selectedAdapter) return false;
    const res = await testAdapterSvc(selectedAdapter);
    setAdapterTested(res.ok);
    return res.ok;
  }, [selectedAdapter]);

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

  const adapterReady = Boolean(selectedAdapter && adapterTested);

  const value = React.useMemo<OnboardingContextValue>(
    () => ({
      complete,
      detectedAdapters,
      selectedAdapter,
      adapterTested,
      adapterReady,
      certTrusted,
      detectAdapters,
      selectAdapter,
      testAdapter,
      verifyCert,
      finish,
    }),
    [complete, detectedAdapters, selectedAdapter, adapterTested, adapterReady, certTrusted, detectAdapters, selectAdapter, testAdapter, verifyCert, finish]
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
