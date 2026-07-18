export type AdapterId = 'claude' | 'codex';

export interface AdapterInfo {
  id: AdapterId;
  installed: boolean;
  authenticated: boolean;
  version: string | null;
}

export type AdapterEvent =
  | { type: 'detect'; adapters: AdapterInfo[] }
  | { type: 'status'; label: string }
  | { type: 'step'; label: string; status: 'done' | 'active' | 'pending' }
  | { type: 'output'; text: string }
  | { type: 'result'; ok: boolean; summary: string }
  | { type: 'error'; message: string; code: string };

export function parseAdapterLine(line: string): AdapterEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === 'object' && typeof (obj as { type?: unknown }).type === 'string') {
      return obj as AdapterEvent;
    }
    return null;
  } catch {
    return null;
  }
}
