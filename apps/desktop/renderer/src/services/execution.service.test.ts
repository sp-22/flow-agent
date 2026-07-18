import { runTask } from './execution.service';

test('streams progress lines then resolves a summary', async () => {
  const lines: string[] = [];
  const summary = await runTask('check staging', s => lines.push(s.label));
  expect(lines.length).toBeGreaterThanOrEqual(2);
  expect(typeof summary).toBe('string');
  expect(summary.length).toBeGreaterThan(0);
});
