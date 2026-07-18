import { SEED_WORKFLOWS, workflowIdForName } from './workflows';

test('seeds three workflows with required fields', () => {
  expect(SEED_WORKFLOWS).toHaveLength(3);
  const priceMonitor = SEED_WORKFLOWS.find(w => w.name === 'Price Monitor');
  expect(priceMonitor?.health).toBe('signal');
  for (const w of SEED_WORKFLOWS) {
    expect(w.mermaid).toMatch(/flowchart/);
    expect(w.services.length).toBeGreaterThan(0);
    expect(w.draft).toBe(false);
    expect(w.steps.length).toBeGreaterThan(0);
  }
});

test('workflowIdForName resolves names case-insensitively', () => {
  expect(workflowIdForName('deploy check')).toBe('deploy-check');
  expect(workflowIdForName('Price Monitor')).toBe('price-monitor');
  expect(workflowIdForName('nope')).toBeUndefined();
});
