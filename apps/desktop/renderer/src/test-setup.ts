import '@testing-library/jest-dom';
import { vi } from 'vitest';
import type { AdapterEvent } from './types';

const defaultAdapter = {
  detect: vi.fn(async () => [
    { id: 'claude', installed: true, authenticated: true, version: 'claude 1.0.0' },
    { id: 'codex', installed: true, authenticated: true, version: 'codex 1.0.0' },
  ]),
  test: vi.fn(async () => ({ ok: true, summary: 'READY' })),
  run: vi.fn(
    async (
      _runId: string,
      args: { adapter: string; prompt: string; cwd?: string },
      onEvent: (event: AdapterEvent) => void
    ) => {
      onEvent({ type: 'status', label: 'Gathering context' });
      onEvent({ type: 'step', label: 'Running the automation', status: 'done' });
      const summary = `Completed · re: "${args.prompt}"`;
      onEvent({ type: 'result', ok: true, summary });
      return { ok: true, summary };
    }
  ),
  cancel: vi.fn(),
};

window.flowAgent = { platform: 'test', adapter: defaultAdapter as never };
