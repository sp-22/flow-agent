import { ipcMain, type WebContents } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAdapterLine, type AdapterEvent, type AdapterInfo } from './adapter-protocol.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(...parts: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log('[flow-runtime]', ...parts);
}

function runtimeDir(): string {
  if (process.env.FLOW_RUNTIME_DIR) return process.env.FLOW_RUNTIME_DIR;
  // dist-electron/main -> repo root -> services/flow-runtime
  return path.resolve(__dirname, '../../../../services/flow-runtime');
}

function resolvePython(): string {
  if (process.env.FLOW_RUNTIME_PYTHON) return process.env.FLOW_RUNTIME_PYTHON;
  const venv = path.join(runtimeDir(), '.venv', 'bin', 'python');
  if (fs.existsSync(venv)) return venv;
  return 'python3';
}

/**
 * GUI/Electron processes launch with a reduced PATH that omits user-level bin
 * dirs (e.g. ~/.local/bin, /opt/homebrew/bin) where the agentic CLIs live, so
 * a spawned Python's shutil.which() can't find them. Merge the common install
 * locations onto the inherited PATH so detect/test/run see the CLIs.
 */
function augmentedPath(): string {
  const home = process.env.HOME ?? '';
  const extras = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    home ? path.join(home, '.local', 'bin') : '',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ].filter(Boolean);
  const current = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  const merged = [...current];
  for (const dir of extras) if (!merged.includes(dir)) merged.push(dir);
  return merged.join(path.delimiter);
}

function spawnRuntime(args: string[]): ChildProcess {
  const dir = runtimeDir();
  const python = resolvePython();
  log('spawn:', python, '-m flow_runtime', args.join(' '), '(cwd:', dir + ')');
  return spawn(python, ['-m', 'flow_runtime', ...args], {
    cwd: dir,
    env: { ...process.env, PATH: augmentedPath(), PYTHONPATH: path.join(dir, 'src') },
  });
}

function collect(args: string[], stdin?: string): Promise<{ events: AdapterEvent[]; code: number; stderr: string }> {
  return new Promise((resolve) => {
    let child: ChildProcess;
    try {
      child = spawnRuntime(args);
    } catch (err) {
      resolve({
        events: [{ type: 'error', message: String(err), code: 'SPAWN_FAILED' }],
        code: 1,
        stderr: '',
      });
      return;
    }
    const events: AdapterEvent[] = [];
    let buffer = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      let idx: number;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        const ev = parseAdapterLine(line);
        if (ev) events.push(ev);
      }
    });
    child.stderr?.on('data', (c: Buffer) => (stderr += c.toString()));
    child.on('error', (err) => {
      events.push({ type: 'error', message: String(err), code: 'SPAWN_FAILED' });
    });
    child.on('close', (code) => {
      const tail = parseAdapterLine(buffer);
      if (tail) events.push(tail);
      log('exit', code, '·', args.join(' '), '·', events.length, 'events');
      if (stderr.trim()) log('stderr:', stderr.trim());
      resolve({ events, code: code ?? 0, stderr });
    });
  });
}

const runs = new Map<string, ChildProcess>();

function startRun(
  sender: WebContents,
  runId: string,
  adapter: string,
  prompt: string,
  cwd?: string
): void {
  const args = ['run', '--adapter', adapter];
  if (cwd) args.push('--cwd', cwd);
  let child: ChildProcess;
  try {
    child = spawnRuntime(args);
  } catch (err) {
    sender.send('adapter:run:event', {
      runId,
      event: { type: 'error', message: String(err), code: 'SPAWN_FAILED' },
    });
    return;
  }
  runs.set(runId, child);
  log('run start:', adapter, '· runId', runId, '· prompt:', JSON.stringify(prompt.slice(0, 80)));
  child.stdin?.write(prompt);
  child.stdin?.end();

  let buffer = '';
  let stderr = '';
  let terminated = false;
  const send = (event: AdapterEvent) => {
    log('run event:', event.type, '·', 'label' in event ? event.label : 'text' in event ? JSON.stringify(String(event.text).slice(0, 80)) : '');
    if (event.type === 'result' || event.type === 'error') terminated = true;
    if (!sender.isDestroyed()) sender.send('adapter:run:event', { runId, event });
  };

  child.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      const ev = parseAdapterLine(line);
      if (ev) send(ev);
    }
  });
  child.stderr?.on('data', (c: Buffer) => (stderr += c.toString()));
  child.on('error', (err) => send({ type: 'error', message: String(err), code: 'SPAWN_FAILED' }));
  child.on('close', (code) => {
    const tail = parseAdapterLine(buffer);
    if (tail) send(tail);
    runs.delete(runId);
    log('run exit', code, '· runId', runId);
    if (!terminated) {
      if (code === 0) send({ type: 'result', ok: true, summary: 'Completed' });
      else send({ type: 'error', message: stderr.trim() || `exited with code ${code}`, code: 'RUNTIME_ERROR' });
    }
  });
}

export function registerAdapterManager(): void {
  ipcMain.handle('adapter:detect', async (): Promise<AdapterInfo[]> => {
    log('detect requested');
    const { events } = await collect(['detect']);
    const detect = events.find((e) => e.type === 'detect');
    const adapters = detect && detect.type === 'detect' ? detect.adapters : [];
    log('detect result:', JSON.stringify(adapters));
    return adapters;
  });

  ipcMain.handle('adapter:test', async (_e, { adapter }: { adapter: string }) => {
    log('test requested:', adapter);
    const { events } = await collect(['test', '--adapter', adapter]);
    const result = events.find((e) => e.type === 'result');
    if (result && result.type === 'result' && result.ok) {
      log('test OK:', adapter, '·', result.summary);
      return { ok: true, summary: result.summary };
    }
    const error = events.find((e) => e.type === 'error');
    const message = error && error.type === 'error' ? error.message : 'Adapter test failed';
    log('test FAIL:', adapter, '·', message);
    return { ok: false, error: message };
  });

  ipcMain.handle(
    'adapter:run:start',
    async (e, { runId, adapter, prompt, cwd }: { runId: string; adapter: string; prompt: string; cwd?: string }) => {
      startRun(e.sender, runId, adapter, prompt, cwd);
      return { started: true };
    }
  );

  ipcMain.on('adapter:run:cancel', (_e, { runId }: { runId: string }) => {
    const child = runs.get(runId);
    if (child) {
      child.kill('SIGTERM');
      runs.delete(runId);
    }
  });
}
