import type { RunStep, Workflow } from '../types';
import { SEED_WORKFLOWS } from '../mock/workflows';

const STEP_DELAY_MS = 150;

const BUILD_STEPS: string[] = [
  'Listening to what you explained',
  'Figuring out the steps',
  'Writing the automation',
  'Drawing the flowchart',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function newDraftId(): string {
  return `draft-${crypto.randomUUID()}`;
}

/**
 * Emits the four plain-language build steps (each marked `done` as it
 * completes) via `onStep`, then resolves a new draft Workflow modeled on a
 * seed workflow shape. Pure timer-based stub — no real IO.
 */
export async function buildSkill(onStep: (step: RunStep) => void): Promise<Workflow> {
  for (const label of BUILD_STEPS) {
    await delay(STEP_DELAY_MS);
    onStep({ label, status: 'done' });
  }

  const base = SEED_WORKFLOWS[0] as Workflow;

  return {
    ...base,
    id: newDraftId(),
    name: 'New Automation',
    icon: 'sparkles',
    description: 'A freshly generated automation, ready for review before it goes live.',
    health: 'signal',
    lastRunRelative: 'never run',
    runSparkline: [],
    summary: 'draft · not yet run',
    draft: true,
  };
}
