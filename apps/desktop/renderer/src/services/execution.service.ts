import type { AdapterEvent, AdapterId, RunStep } from '../types';
import { runAdapter } from './adapter.service';

/**
 * Drives one adapter run for `prompt`, mapping streamed adapter events to
 * `RunStep`s via `onLine`, and resolving with the run summary. Rejects on a
 * terminal adapter error so the store can render a failed bubble.
 */
export function runTask(
  prompt: string,
  adapter: AdapterId,
  onLine: (step: RunStep) => void,
  runId: string
): Promise<string> {
  return runAdapter(runId, { adapter, prompt }, (event: AdapterEvent) => {
    if (event.type === 'status') {
      onLine({ label: event.label, status: 'active' });
    } else if (event.type === 'step') {
      onLine({ label: event.label, status: event.status });
    } else if (event.type === 'output') {
      onLine({ label: event.text, status: 'done' });
    }
  }).then((res) => {
    if (res.ok) return res.summary ?? 'Completed';
    throw new Error(res.error ?? 'Adapter run failed');
  });
}
