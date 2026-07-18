import type { RunStep } from '../types';

const STEP_DELAY_MS = 150;

const RUN_STEPS: string[] = ['Gathering context', 'Running the automation', 'Verifying the result'];

const CANNED_SUMMARIES: string[] = [
  'All checks passed · no action needed · 3 steps',
  'Completed successfully · 1 issue flagged for review · 3 steps',
  'Task finished · summary posted to the team channel · 3 steps',
];

/**
 * Streams a short sequence of RunSteps to `onLine` (each marked `done` as it
 * completes) then resolves with a canned summary string. Pure timer-based
 * stub — no real IO.
 */
export function runTask(prompt: string, onLine: (step: RunStep) => void): Promise<string> {
  return new Promise(resolve => {
    let index = 0;

    const emitNext = (): void => {
      if (index >= RUN_STEPS.length) {
        const summary = CANNED_SUMMARIES[Math.floor(Math.random() * CANNED_SUMMARIES.length)] as string;
        resolve(`${summary} · re: "${prompt}"`);
        return;
      }

      const label = RUN_STEPS[index] as string;
      onLine({ label, status: 'done' });
      index += 1;
      setTimeout(emitNext, STEP_DELAY_MS);
    };

    setTimeout(emitNext, STEP_DELAY_MS);
  });
}
