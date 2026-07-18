import { contextBridge, ipcRenderer } from 'electron';

interface AdapterEvent {
  type: string;
  [key: string]: unknown;
}

contextBridge.exposeInMainWorld('flowAgent', {
  platform: process.platform,
  adapter: {
    detect: () => ipcRenderer.invoke('adapter:detect'),
    test: (adapter: string) => ipcRenderer.invoke('adapter:test', { adapter }),
    run: (
      runId: string,
      args: { adapter: string; prompt: string; cwd?: string },
      onEvent: (event: AdapterEvent) => void
    ) =>
      new Promise((resolve) => {
        const listener = (_e: unknown, payload: { runId: string; event: AdapterEvent }) => {
          if (payload.runId !== runId) return;
          onEvent(payload.event);
          if (payload.event.type === 'result') {
            cleanup();
            resolve({ ok: (payload.event as { ok?: boolean }).ok ?? false, summary: (payload.event as { summary?: string }).summary });
          } else if (payload.event.type === 'error') {
            cleanup();
            resolve({ ok: false, error: (payload.event as { message?: string }).message });
          }
        };
        const cleanup = () => ipcRenderer.removeListener('adapter:run:event', listener);
        ipcRenderer.on('adapter:run:event', listener);
        ipcRenderer.invoke('adapter:run:start', { runId, adapter: args.adapter, prompt: args.prompt, cwd: args.cwd });
      }),
    cancel: (runId: string) => ipcRenderer.send('adapter:run:cancel', { runId }),
  },
});
