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

test('every seed workflow includes a non-empty flow graph', () => {
  for (const w of SEED_WORKFLOWS) {
    expect(w.flow.nodes.length).toBeGreaterThan(0);
    expect(w.flow.edges.length).toBeGreaterThan(0);
  }
});

test('deploy-check flow mirrors screenshot step titles', () => {
  const w = SEED_WORKFLOWS.find((x) => x.id === 'deploy-check')!;
  const titles = w.flow.nodes.map((n) => n.title);
  expect(titles).toEqual(
    expect.arrayContaining([
      'Fetch latest Actions run',
      'Deploy failed?',
      'Query errors (last 24h)',
      'Post summary',
      'Done',
    ])
  );
});
