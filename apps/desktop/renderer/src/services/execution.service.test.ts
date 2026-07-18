import type { RunStep } from '../types';
import { runTask } from './execution.service';

test('maps adapter events to RunSteps and resolves the summary', async () => {
  const steps: RunStep[] = [];
  const summary = await runTask('check staging', 'claude', (s) => steps.push(s), 'run-test-1');
  expect(steps.length).toBeGreaterThanOrEqual(2);
  expect(summary).toContain('re: "check staging"');
});
