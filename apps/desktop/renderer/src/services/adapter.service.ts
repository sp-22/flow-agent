import type { AdapterActionResult, AdapterBridge, AdapterEvent, AdapterId, AdapterInfo } from '../types';

export const ADAPTER_STORAGE_KEY = 'workflowpilot:adapter';

function bridge(): AdapterBridge {
  const fa = window.flowAgent;
  if (!fa || !fa.adapter) throw new Error('BACKEND_UNAVAILABLE');
  return fa.adapter;
}

export function isBackendAvailable(): boolean {
  return Boolean(window.flowAgent && window.flowAgent.adapter);
}

export function detectAdapters(): Promise<AdapterInfo[]> {
  return bridge().detect();
}

export function testAdapter(id: AdapterId): Promise<AdapterActionResult> {
  return bridge().test(id);
}

export function runAdapter(
  runId: string,
  args: { adapter: AdapterId; prompt: string; cwd?: string },
  onEvent: (event: AdapterEvent) => void
): Promise<AdapterActionResult> {
  return bridge().run(runId, args, onEvent);
}

export function cancelAdapter(runId: string): void {
  bridge().cancel(runId);
}

export function getSelectedAdapter(): AdapterId {
  try {
    const v = window.localStorage.getItem(ADAPTER_STORAGE_KEY);
    return v === 'codex' ? 'codex' : 'claude';
  } catch {
    return 'claude';
  }
}

export function setSelectedAdapter(id: AdapterId): void {
  try {
    window.localStorage.setItem(ADAPTER_STORAGE_KEY, id);
  } catch {
    // localStorage unavailable — degrade to no-op.
  }
}
