import { detectAdapters, testAdapter, getSelectedAdapter, setSelectedAdapter } from './adapter.service';

test('detectAdapters returns the bridge adapters', async () => {
  const infos = await detectAdapters();
  expect(infos.map((a) => a.id).sort()).toEqual(['claude', 'codex']);
});

test('testAdapter resolves ok from the bridge', async () => {
  const res = await testAdapter('claude');
  expect(res.ok).toBe(true);
});

test('selected adapter round-trips through localStorage, defaults to claude', () => {
  window.localStorage.removeItem('workflowpilot:adapter');
  expect(getSelectedAdapter()).toBe('claude');
  setSelectedAdapter('codex');
  expect(getSelectedAdapter()).toBe('codex');
});
