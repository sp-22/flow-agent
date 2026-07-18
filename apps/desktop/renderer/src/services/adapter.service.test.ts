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
  const values = new Map<string, string>();
  const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };

  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });

  try {
    expect(getSelectedAdapter()).toBe('claude');
    setSelectedAdapter('codex');
    expect(getSelectedAdapter()).toBe('codex');
  } finally {
    if (originalStorage) Object.defineProperty(window, 'localStorage', originalStorage);
  }
});
