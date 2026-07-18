import { SEED_WORKFLOWS } from './workflows';

test('seeds three workflows with required fields', () => {
  expect(SEED_WORKFLOWS).toHaveLength(3);
  const priceMonitor = SEED_WORKFLOWS.find(w => w.name === 'Price Monitor');
  expect(priceMonitor?.health).toBe('signal');
  for (const w of SEED_WORKFLOWS) {
    expect(w.mermaid).toMatch(/flowchart/);
    expect(w.services.length).toBeGreaterThan(0);
    expect(w.draft).toBe(false);
  }
});
