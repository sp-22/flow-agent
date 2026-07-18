# CLI Adapter Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock API-key onboarding step and the timer-based execution stub with a real, embedded Python adapter runtime that drives the `claude`/`codex` CLIs headlessly and streams normalized JSONL events over stdout → Electron IPC → renderer.

**Architecture:** A Python package `flow_runtime` (in `services/flow-runtime`) exposes `detect`/`test`/`run` subcommands, each emitting one JSON object per stdout line. Electron main spawns a short-lived Python process per action, parses the JSONL, and bridges it to the renderer (invoke/handle for detect+test, streamed events for run). The renderer's onboarding picks/tests an adapter; each execution task spawns a fresh adapter run.

**Tech Stack:** Python 3.11+ (stdlib only, `pytest` for tests) · Electron 31 (Node `child_process`) · React 18 + TypeScript (strict) · Vitest 2 + React Testing Library.

## Global Constraints

- **Electron-only feature.** No timer-mock runtime fallback. When the backend bridge is absent, surface a `BACKEND_UNAVAILABLE` error — do not silently fake a run.
- **Adapters use the CLI's own login** (`claude login` / `codex login`). No API key is entered in-app.
- **Adapter ids are exactly** `'claude'` and `'codex'`.
- **Unified JSONL event schema** (identical on both sides), one JSON object per line:
  - `{"type":"detect","adapters":AdapterInfo[]}`
  - `{"type":"status","label":string}`
  - `{"type":"step","label":string,"status":"done"|"active"|"pending"}`
  - `{"type":"output","text":string}`
  - `{"type":"result","ok":boolean,"summary":string}`
  - `{"type":"error","message":string,"code":string}`
  - Error `code` ∈ `NOT_INSTALLED | NOT_AUTHED | SPAWN_FAILED | CANCELLED | RUNTIME_ERROR`.
- `AdapterInfo = {id:'claude'|'codex', installed:boolean, authenticated:boolean, version:string|null}`.
- **Process model:** one short-lived Python process per action; `run` processes are tracked by `runId` for cancellation.
- TDD, frequent commits, DRY, YAGNI.

## Parallelization (waves)

Tasks 1–3 touch **disjoint directories** and are dispatched **in parallel**:
- **Task 1** — `services/flow-runtime/**` (Python only)
- **Task 2** — `apps/desktop/electron/**` (Electron main + preload)
- **Task 3** — `apps/desktop/renderer/**` onboarding + shared types + adapter service + test bridge mock

**Task 4** (executions wiring) runs **after Task 3** — it depends on Task 3's renderer types, `adapter.service.ts`, and the global test bridge mock. It is independent of Tasks 1–2 at the file level.

The three sides agree only via the JSONL schema pinned in Global Constraints; there are no cross-file imports between the waves.

---

## Task 1: Python `flow_runtime` backend

**Files:**
- Create: `services/flow-runtime/pyproject.toml`
- Create: `services/flow-runtime/src/flow_runtime/__init__.py`
- Create: `services/flow-runtime/src/flow_runtime/__main__.py`
- Create: `services/flow-runtime/src/flow_runtime/events.py`
- Create: `services/flow-runtime/src/flow_runtime/adapters/__init__.py`
- Create: `services/flow-runtime/src/flow_runtime/adapters/base.py`
- Create: `services/flow-runtime/src/flow_runtime/adapters/claude.py`
- Create: `services/flow-runtime/src/flow_runtime/adapters/codex.py`
- Create: `services/flow-runtime/src/flow_runtime/adapters/registry.py`
- Modify: `services/flow-runtime/src/flow_runtime/cli.py` (currently empty)
- Test: `services/flow-runtime/tests/conftest.py`
- Test: `services/flow-runtime/tests/test_cli.py`
- Test: `services/flow-runtime/tests/test_adapters.py`

**Interfaces:**
- Consumes: nothing (leaf).
- Produces (the contract Electron relies on):
  - `python -m flow_runtime detect` → stdout one line `{"type":"detect","adapters":[AdapterInfo…]}`, exit 0.
  - `python -m flow_runtime test --adapter <claude|codex>` → streams events, exit 0 iff a `result` with `ok:true` was emitted.
  - `python -m flow_runtime run --adapter <claude|codex> [--cwd PATH]` → reads the prompt from **stdin**, streams `output` lines then a terminal `result`/`error`, exit 0 iff `result.ok`.
  - Python module importable as `flow_runtime` with `src/` on `PYTHONPATH`.

- [ ] **Step 1: Write failing tests**

`services/flow-runtime/tests/conftest.py`:

```python
import os
import stat
import sys
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[1] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


def _write_fake_cli(dir_path: Path, name: str, body: str) -> None:
    script = dir_path / name
    script.write_text("#!/usr/bin/env python3\n" + body)
    script.chmod(script.stat().st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)


@pytest.fixture
def fake_cli(tmp_path, monkeypatch):
    """Put a fake `claude`/`codex` on PATH that echoes stdout and exits 0."""
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()

    def install(name: str, *, lines=("hello", "READY"), exit_code=0):
        body = (
            "import sys\n"
            f"for line in {list(lines)!r}:\n"
            "    print(line)\n"
            f"sys.exit({exit_code})\n"
        )
        _write_fake_cli(bin_dir, name, body)

    monkeypatch.setenv("PATH", str(bin_dir) + os.pathsep + os.environ["PATH"])
    return install
```

`services/flow-runtime/tests/test_adapters.py`:

```python
from flow_runtime.adapters.registry import get_adapter, all_adapters


def test_registry_exposes_both_adapters():
    ids = sorted(a.id for a in all_adapters())
    assert ids == ["claude", "codex"]


def test_detect_reports_not_installed_when_missing(monkeypatch):
    monkeypatch.setenv("PATH", "")
    info = get_adapter("claude").detect()
    assert info.installed is False
    assert info.authenticated is False
    assert info.version is None
    assert info.id == "claude"


def test_detect_reports_installed_when_present(fake_cli):
    fake_cli("claude", lines=("claude 1.2.3",))
    info = get_adapter("claude").detect()
    assert info.installed is True
    assert info.version is not None


def test_run_streams_output_then_result(fake_cli):
    fake_cli("codex", lines=("working", "done"))
    events = list(get_adapter("codex").run("do a thing", None))
    assert events[0] == {"type": "output", "text": "working"}
    assert events[-1]["type"] == "result"
    assert events[-1]["ok"] is True


def test_run_reports_error_on_nonzero_exit(fake_cli):
    fake_cli("codex", lines=("boom",), exit_code=3)
    events = list(get_adapter("codex").run("x", None))
    assert events[-1]["type"] == "error"
    assert events[-1]["code"] == "RUNTIME_ERROR"
```

`services/flow-runtime/tests/test_cli.py`:

```python
import json
import subprocess
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"


def _run(args, stdin=""):
    env = {"PYTHONPATH": str(SRC)}
    import os

    env = {**os.environ, **env}
    proc = subprocess.run(
        [sys.executable, "-m", "flow_runtime", *args],
        input=stdin,
        capture_output=True,
        text=True,
        env=env,
    )
    return proc


def _events(stdout):
    return [json.loads(line) for line in stdout.splitlines() if line.strip()]


def test_detect_emits_single_detect_event():
    proc = _run(["detect"])
    assert proc.returncode == 0
    events = _events(proc.stdout)
    assert len(events) == 1
    assert events[0]["type"] == "detect"
    ids = sorted(a["id"] for a in events[0]["adapters"])
    assert ids == ["claude", "codex"]


def test_run_reads_prompt_from_stdin(fake_cli):
    fake_cli("claude", lines=("ok",))
    proc = _run(["run", "--adapter", "claude"], stdin="hello there")
    assert proc.returncode == 0
    events = _events(proc.stdout)
    assert events[-1]["type"] == "result"
    assert events[-1]["ok"] is True


def test_test_command_fails_when_not_installed(monkeypatch):
    proc = _run(["test", "--adapter", "claude"])
    # No fake CLI on PATH → not installed → error + nonzero exit.
    events = _events(proc.stdout)
    assert events[-1]["type"] == "error"
    assert events[-1]["code"] == "NOT_INSTALLED"
    assert proc.returncode != 0
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `cd services/flow-runtime && python -m pytest -q`
Expected: FAIL / collection errors (`flow_runtime` not importable yet).

- [ ] **Step 3: Implement the package**

`services/flow-runtime/pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "flow-runtime"
version = "0.1.0"
description = "Flow Agent CLI adapter runtime (claude/codex)"
requires-python = ">=3.11"

[project.optional-dependencies]
dev = ["pytest>=8"]

[project.scripts]
flow-runtime = "flow_runtime.cli:main"

[tool.setuptools.packages.find]
where = ["src"]
```

`services/flow-runtime/src/flow_runtime/__init__.py`:

```python
__all__ = ["cli"]
```

`services/flow-runtime/src/flow_runtime/__main__.py`:

```python
from .cli import main

if __name__ == "__main__":
    raise SystemExit(main())
```

`services/flow-runtime/src/flow_runtime/events.py`:

```python
import json
import sys
from typing import Any, Dict


def emit(event: Dict[str, Any]) -> None:
    """Write one JSON object per line to stdout and flush immediately."""
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()
```

`services/flow-runtime/src/flow_runtime/adapters/__init__.py`:

```python
```

`services/flow-runtime/src/flow_runtime/adapters/base.py`:

```python
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, List, Optional


@dataclass
class AdapterInfo:
    id: str
    installed: bool
    authenticated: bool
    version: Optional[str]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "installed": self.installed,
            "authenticated": self.authenticated,
            "version": self.version,
        }


class Adapter:
    """Base adapter that shells out to an agentic CLI and normalizes output.

    Subclasses set class attributes only.
    """

    id: str = ""
    binary: str = ""
    run_args: List[str] = []
    test_prompt: str = "Reply with the single word READY"
    config_paths: List[str] = []
    env_keys: List[str] = []

    def _resolve_binary(self) -> Optional[str]:
        return shutil.which(self.binary)

    def _version(self, path: str) -> Optional[str]:
        try:
            out = subprocess.run(
                [path, "--version"], capture_output=True, text=True, timeout=10
            )
        except Exception:
            return None
        text = (out.stdout or out.stderr or "").strip()
        return text.splitlines()[0] if text else None

    def _authenticated(self) -> bool:
        if any(os.environ.get(k) for k in self.env_keys):
            return True
        return any((Path.home() / p).exists() for p in self.config_paths)

    def detect(self) -> AdapterInfo:
        path = self._resolve_binary()
        if path is None:
            return AdapterInfo(self.id, False, False, None)
        return AdapterInfo(self.id, True, self._authenticated(), self._version(path))

    def _stream(self, prompt: str, cwd: Optional[str]) -> Iterator[dict]:
        path = self._resolve_binary()
        if path is None:
            yield {
                "type": "error",
                "message": f"{self.binary} CLI not found on PATH",
                "code": "NOT_INSTALLED",
            }
            return
        argv = [path, *self.run_args, prompt]
        try:
            proc = subprocess.Popen(
                argv,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=cwd,
                bufsize=1,
            )
        except Exception as exc:  # spawn failure
            yield {"type": "error", "message": str(exc), "code": "SPAWN_FAILED"}
            return

        last = ""
        assert proc.stdout is not None
        for line in proc.stdout:
            text = line.rstrip("\n")
            if text.strip():
                last = text.strip()
                yield {"type": "output", "text": text}
        code = proc.wait()
        if code == 0:
            yield {"type": "result", "ok": True, "summary": last or "Completed"}
        else:
            err = (proc.stderr.read() if proc.stderr else "").strip()
            yield {
                "type": "error",
                "message": err or f"{self.binary} exited with code {code}",
                "code": "RUNTIME_ERROR",
            }

    def run(self, prompt: str, cwd: Optional[str]) -> Iterator[dict]:
        yield {"type": "status", "label": "Starting adapter"}
        yield from self._stream(prompt, cwd)

    def test(self) -> Iterator[dict]:
        yield {"type": "status", "label": "Probing adapter"}
        yield from self._stream(self.test_prompt, None)
```

`services/flow-runtime/src/flow_runtime/adapters/claude.py`:

```python
from .base import Adapter


class ClaudeAdapter(Adapter):
    id = "claude"
    binary = "claude"
    run_args = ["-p"]
    config_paths = [".claude.json", ".claude/.credentials.json"]
    env_keys = ["ANTHROPIC_API_KEY"]
```

`services/flow-runtime/src/flow_runtime/adapters/codex.py`:

```python
from .base import Adapter


class CodexAdapter(Adapter):
    id = "codex"
    binary = "codex"
    run_args = ["exec"]
    config_paths = [".codex/auth.json"]
    env_keys = ["OPENAI_API_KEY"]
```

`services/flow-runtime/src/flow_runtime/adapters/registry.py`:

```python
from typing import List, Optional

from .base import Adapter
from .claude import ClaudeAdapter
from .codex import CodexAdapter

_ADAPTERS = {a.id: a for a in (ClaudeAdapter(), CodexAdapter())}


def all_adapters() -> List[Adapter]:
    return list(_ADAPTERS.values())


def get_adapter(adapter_id: str) -> Optional[Adapter]:
    return _ADAPTERS.get(adapter_id)
```

`services/flow-runtime/src/flow_runtime/cli.py`:

```python
import argparse
import sys
from typing import List, Optional

from .adapters.registry import all_adapters, get_adapter
from .events import emit


def _cmd_detect(_args: argparse.Namespace) -> int:
    emit({"type": "detect", "adapters": [a.detect().to_dict() for a in all_adapters()]})
    return 0


def _drive(adapter_id: str, events) -> int:
    adapter = get_adapter(adapter_id)
    if adapter is None:
        emit({"type": "error", "message": f"Unknown adapter {adapter_id}", "code": "RUNTIME_ERROR"})
        return 1
    info = adapter.detect()
    if not info.installed:
        emit({"type": "error", "message": f"{adapter.id} CLI not installed", "code": "NOT_INSTALLED"})
        return 1
    ok = False
    for event in events(adapter):
        emit(event)
        if event.get("type") == "result":
            ok = bool(event.get("ok"))
        elif event.get("type") == "error":
            ok = False
    return 0 if ok else 1


def _cmd_test(args: argparse.Namespace) -> int:
    return _drive(args.adapter, lambda a: a.test())


def _cmd_run(args: argparse.Namespace) -> int:
    prompt = sys.stdin.read().strip()
    return _drive(args.adapter, lambda a: a.run(prompt, args.cwd))


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="flow_runtime")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("detect").set_defaults(func=_cmd_detect)

    p_test = sub.add_parser("test")
    p_test.add_argument("--adapter", required=True, choices=["claude", "codex"])
    p_test.set_defaults(func=_cmd_test)

    p_run = sub.add_parser("run")
    p_run.add_argument("--adapter", required=True, choices=["claude", "codex"])
    p_run.add_argument("--cwd", default=None)
    p_run.set_defaults(func=_cmd_run)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = _build_parser().parse_args(argv)
    return int(args.func(args))
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd services/flow-runtime && python -m pytest -q`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add services/flow-runtime
git commit -m "feat(flow-runtime): python adapter backend (detect/test/run) for claude+codex"
```

---

## Task 2: Electron adapter bridge (main + preload)

**Files:**
- Create: `apps/desktop/electron/main/adapter-protocol.ts`
- Create: `apps/desktop/electron/main/adapter-manager.ts`
- Modify: `apps/desktop/electron/main/main.ts`
- Modify: `apps/desktop/electron/preload/preload.ts`
- Test: `apps/desktop/electron/main/adapter-protocol.test.ts`

**Interfaces:**
- Consumes: the Python contract from Task 1 (JSONL schema in Global Constraints). Do **not** import Python; spawn `python -m flow_runtime …`.
- Produces (renderer relies on these via `window.flowAgent.adapter`):
  - `detect(): Promise<AdapterInfo[]>`
  - `test(adapter): Promise<{ok:boolean;summary?:string;error?:string}>`
  - `run(runId, {adapter,prompt,cwd?}, onEvent): Promise<{ok:boolean;summary?:string;error?:string}>`
  - `cancel(runId): void`
  - Pure `parseAdapterLine(line): AdapterEvent | null` exported from `adapter-protocol.ts` (no electron imports, so Vitest can test it).

- [ ] **Step 1: Write the failing test**

`apps/desktop/electron/main/adapter-protocol.test.ts`:

```ts
import { parseAdapterLine } from './adapter-protocol';

test('parses a valid JSON event line', () => {
  const e = parseAdapterLine('{"type":"result","ok":true,"summary":"done"}');
  expect(e).toEqual({ type: 'result', ok: true, summary: 'done' });
});

test('ignores blank and non-JSON noise lines', () => {
  expect(parseAdapterLine('')).toBeNull();
  expect(parseAdapterLine('   ')).toBeNull();
  expect(parseAdapterLine('not json at all')).toBeNull();
});

test('ignores JSON without a string type', () => {
  expect(parseAdapterLine('{"foo":1}')).toBeNull();
  expect(parseAdapterLine('[1,2,3]')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run electron/main/adapter-protocol.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `adapter-protocol.ts`**

`apps/desktop/electron/main/adapter-protocol.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npx vitest run electron/main/adapter-protocol.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `adapter-manager.ts`**

`apps/desktop/electron/main/adapter-manager.ts`:

```ts
import { ipcMain, type WebContents } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAdapterLine, type AdapterEvent, type AdapterInfo } from './adapter-protocol';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function spawnRuntime(args: string[]): ChildProcess {
  const dir = runtimeDir();
  return spawn(resolvePython(), ['-m', 'flow_runtime', ...args], {
    cwd: dir,
    env: { ...process.env, PYTHONPATH: path.join(dir, 'src') },
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
  child.stdin?.write(prompt);
  child.stdin?.end();

  let buffer = '';
  let stderr = '';
  let terminated = false;
  const send = (event: AdapterEvent) => {
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
    if (!terminated) {
      if (code === 0) send({ type: 'result', ok: true, summary: 'Completed' });
      else send({ type: 'error', message: stderr.trim() || `exited with code ${code}`, code: 'RUNTIME_ERROR' });
    }
  });
}

export function registerAdapterManager(): void {
  ipcMain.handle('adapter:detect', async (): Promise<AdapterInfo[]> => {
    const { events } = await collect(['detect']);
    const detect = events.find((e) => e.type === 'detect');
    return detect && detect.type === 'detect' ? detect.adapters : [];
  });

  ipcMain.handle('adapter:test', async (_e, { adapter }: { adapter: string }) => {
    const { events } = await collect(['test', '--adapter', adapter]);
    const result = events.find((e) => e.type === 'result');
    if (result && result.type === 'result' && result.ok) return { ok: true, summary: result.summary };
    const error = events.find((e) => e.type === 'error');
    return { ok: false, error: error && error.type === 'error' ? error.message : 'Adapter test failed' };
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
```

- [ ] **Step 6: Wire the manager into `main.ts`**

Modify `apps/desktop/electron/main/main.ts` — add the import at the top and call `registerAdapterManager()` inside `app.whenReady().then(...)` before `createWindow()`:

```ts
import { app, BrowserWindow, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerAdapterManager } from './adapter-manager';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 1000, minHeight: 680,
    titleBarStyle: 'hiddenInset', backgroundColor: '#09090b',
    icon: path.join(__dirname, '../../public/logo.png'),
    webPreferences: { preload: path.join(__dirname, '../preload/preload.js') },
  });
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(__dirname, '../../dist/index.html'));
}

app.whenReady().then(() => {
  registerAdapterManager();
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, '../../public/logo.png');
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
```

- [ ] **Step 7: Expose the bridge in `preload.ts`**

Replace `apps/desktop/electron/preload/preload.ts` with:

```ts
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
```

- [ ] **Step 8: Typecheck the electron project + run the protocol test**

Run: `cd apps/desktop && npx tsc -p tsconfig.electron.json --noEmit && npx vitest run electron/main/adapter-protocol.test.ts`
Expected: no type errors; test PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/desktop/electron
git commit -m "feat(electron): adapter manager IPC + preload bridge spawning flow_runtime"
```

---

## Task 3: Renderer types, adapter service, onboarding step

**Files:**
- Modify: `apps/desktop/renderer/src/types/index.ts` (append adapter types)
- Create: `apps/desktop/renderer/src/services/adapter.service.ts`
- Create: `apps/desktop/renderer/src/services/adapter.service.test.ts`
- Modify: `apps/desktop/renderer/src/store/onboarding.store.tsx` (replace api-key state with adapter state)
- Create: `apps/desktop/renderer/src/features/onboarding/steps/StepAdapter.tsx`
- Delete: `apps/desktop/renderer/src/features/onboarding/steps/StepApiKey.tsx`
- Modify: `apps/desktop/renderer/src/features/onboarding/OnboardingWizard.tsx` (label + gate + import)
- Modify: `apps/desktop/renderer/src/features/onboarding/OnboardingWizard.test.tsx` (new flow)
- Modify: `apps/desktop/renderer/src/test-setup.ts` (install a default `window.flowAgent.adapter` mock)

**Interfaces:**
- Consumes: `window.flowAgent.adapter` (Task 2 shape). In tests this is the mock from `test-setup.ts`.
- Produces (Task 4 relies on these):
  - Types: `AdapterId`, `AdapterInfo`, `AdapterEvent` in `types/index.ts`.
  - `adapter.service.ts` exports:
    - `isBackendAvailable(): boolean`
    - `detectAdapters(): Promise<AdapterInfo[]>`
    - `testAdapter(id: AdapterId): Promise<{ok:boolean;summary?:string;error?:string}>`
    - `runAdapter(runId: string, args:{adapter:AdapterId;prompt:string;cwd?:string}, onEvent:(e:AdapterEvent)=>void): Promise<{ok:boolean;summary?:string;error?:string}>`
    - `cancelAdapter(runId: string): void`
    - `getSelectedAdapter(): AdapterId` (reads localStorage `workflowpilot:adapter`, defaults `'claude'`)
    - `setSelectedAdapter(id: AdapterId): void`
    - exported const `ADAPTER_STORAGE_KEY = 'workflowpilot:adapter'`
  - `test-setup.ts` installs a default mock so any renderer test can send/detect without wiring.

- [ ] **Step 1: Write the failing test**

`apps/desktop/renderer/src/services/adapter.service.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run renderer/src/services/adapter.service.test.ts`
Expected: FAIL (module not found; and `window.flowAgent` mock not yet installed).

- [ ] **Step 3: Append adapter types to `types/index.ts`**

Append to `apps/desktop/renderer/src/types/index.ts`:

```ts
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

export interface AdapterActionResult {
  ok: boolean;
  summary?: string;
  error?: string;
}

export interface AdapterBridge {
  detect(): Promise<AdapterInfo[]>;
  test(adapter: AdapterId): Promise<AdapterActionResult>;
  run(
    runId: string,
    args: { adapter: AdapterId; prompt: string; cwd?: string },
    onEvent: (event: AdapterEvent) => void
  ): Promise<AdapterActionResult>;
  cancel(runId: string): void;
}

declare global {
  interface Window {
    flowAgent?: { platform: string; adapter?: AdapterBridge };
  }
}
```

- [ ] **Step 4: Implement `adapter.service.ts`**

`apps/desktop/renderer/src/services/adapter.service.ts`:

```ts
import type { AdapterActionResult, AdapterBridge, AdapterEvent, AdapterId, AdapterInfo } from '../types';

export const ADAPTER_STORAGE_KEY = 'workflowpilot:adapter';

function bridge(): AdapterBridge {
  const fa = window.flowAgent;
  if (!fa || !fa.adapter) throw new Error('BACKEND_UNAVAILABLE');
  return fa.adapter;
}

export function isBackendAvailable(): boolean {
  return Boolean(window.flowAgent && window.flowAgent.adapter);
}

export function detectAdapters(): Promise<AdapterInfo[]> {
  return bridge().detect();
}

export function testAdapter(id: AdapterId): Promise<AdapterActionResult> {
  return bridge().test(id);
}

export function runAdapter(
  runId: string,
  args: { adapter: AdapterId; prompt: string; cwd?: string },
  onEvent: (event: AdapterEvent) => void
): Promise<AdapterActionResult> {
  return bridge().run(runId, args, onEvent);
}

export function cancelAdapter(runId: string): void {
  bridge().cancel(runId);
}

export function getSelectedAdapter(): AdapterId {
  try {
    const v = window.localStorage.getItem(ADAPTER_STORAGE_KEY);
    return v === 'codex' ? 'codex' : 'claude';
  } catch {
    return 'claude';
  }
}

export function setSelectedAdapter(id: AdapterId): void {
  try {
    window.localStorage.setItem(ADAPTER_STORAGE_KEY, id);
  } catch {
    // localStorage unavailable — degrade to no-op.
  }
}
```

- [ ] **Step 5: Install the default bridge mock in `test-setup.ts`**

Replace `apps/desktop/renderer/src/test-setup.ts` with:

```ts
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
```

- [ ] **Step 6: Run the service test to verify it passes**

Run: `cd apps/desktop && npx vitest run renderer/src/services/adapter.service.test.ts`
Expected: PASS.

- [ ] **Step 7: Rewrite `onboarding.store.tsx`**

Replace `apps/desktop/renderer/src/store/onboarding.store.tsx` with:

```tsx
import * as React from 'react';
import type { AdapterId, AdapterInfo } from '../types';
import {
  detectAdapters as detectAdaptersSvc,
  testAdapter as testAdapterSvc,
  setSelectedAdapter as persistSelectedAdapter,
} from '../services/adapter.service';

const STORAGE_KEY = 'workflowpilot:onboarding-complete';

export interface OnboardingContextValue {
  complete: boolean;
  detectedAdapters: AdapterInfo[];
  selectedAdapter: AdapterId | null;
  adapterTested: boolean;
  adapterReady: boolean;
  detectAdapters(): Promise<void>;
  selectAdapter(id: AdapterId): void;
  testAdapter(): Promise<boolean>;
  finish(): void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | undefined>(undefined);

function readStoredComplete(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStoredComplete(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // localStorage unavailable — degrade to in-memory only.
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [complete, setComplete] = React.useState<boolean>(() => readStoredComplete());
  const [detectedAdapters, setDetectedAdapters] = React.useState<AdapterInfo[]>([]);
  const [selectedAdapter, setSelectedAdapter] = React.useState<AdapterId | null>(null);
  const [adapterTested, setAdapterTested] = React.useState(false);

  const detectAdapters = React.useCallback(async (): Promise<void> => {
    const infos = await detectAdaptersSvc();
    setDetectedAdapters(infos);
    setSelectedAdapter((current) => {
      if (current) return current;
      const preferred = infos.find((a) => a.installed && a.authenticated) ?? infos.find((a) => a.installed);
      if (preferred) {
        persistSelectedAdapter(preferred.id);
        return preferred.id;
      }
      return null;
    });
  }, []);

  const selectAdapter = React.useCallback((id: AdapterId) => {
    setSelectedAdapter(id);
    setAdapterTested(false);
    persistSelectedAdapter(id);
  }, []);

  const testAdapter = React.useCallback(async (): Promise<boolean> => {
    if (!selectedAdapter) return false;
    const res = await testAdapterSvc(selectedAdapter);
    setAdapterTested(res.ok);
    return res.ok;
  }, [selectedAdapter]);

  const finish = React.useCallback(() => {
    setComplete(true);
    writeStoredComplete();
  }, []);

  const adapterReady = Boolean(selectedAdapter && adapterTested);

  const value = React.useMemo<OnboardingContextValue>(
    () => ({
      complete,
      detectedAdapters,
      selectedAdapter,
      adapterTested,
      adapterReady,
      detectAdapters,
      selectAdapter,
      testAdapter,
      finish,
    }),
    [complete, detectedAdapters, selectedAdapter, adapterTested, adapterReady, detectAdapters, selectAdapter, testAdapter, finish]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
```

- [ ] **Step 8: Create `StepAdapter.tsx`**

`apps/desktop/renderer/src/features/onboarding/steps/StepAdapter.tsx`:

```tsx
import * as React from 'react';
import { CircleCheck, Circle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useOnboarding } from '../../../store/onboarding.store';
import type { AdapterId } from '../../../types';

const ADAPTERS: Array<{ id: AdapterId; name: string; hint: string }> = [
  { id: 'claude', name: 'Claude Code', hint: 'Runs `claude` — sign in with `claude login`.' },
  { id: 'codex', name: 'Codex', hint: 'Runs `codex` — sign in with `codex login`.' },
];

export function StepAdapter(): JSX.Element {
  const {
    detectedAdapters,
    selectedAdapter,
    adapterTested,
    detectAdapters,
    selectAdapter,
    testAdapter,
  } = useOnboarding();
  const [testing, setTesting] = React.useState(false);
  const [testError, setTestError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void detectAdapters();
  }, [detectAdapters]);

  const infoFor = (id: AdapterId) => detectedAdapters.find((a) => a.id === id);

  const handleTest = async (): Promise<void> => {
    setTesting(true);
    setTestError(null);
    try {
      const ok = await testAdapter();
      if (!ok) setTestError('Adapter test failed — check the CLI is installed and signed in.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg text-heading">Choose your adapter</h2>
      <p className="text-sm text-muted">
        Flow Agent drives an agentic CLI you already use. Pick one — it runs on this device
        using the CLI&apos;s own login. No API key needed.
      </p>

      <div className="flex flex-col gap-2">
        {ADAPTERS.map(({ id, name, hint }) => {
          const info = infoFor(id);
          const installed = info?.installed ?? false;
          const authed = info?.authenticated ?? false;
          const selected = selectedAdapter === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`adapter-card-${id}`}
              aria-pressed={selected}
              disabled={!installed}
              onClick={() => selectAdapter(id)}
              className={
                'flex items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors ' +
                (selected ? 'border-wire-hover bg-elevated' : 'border-wire bg-surface hover:border-wire-hover') +
                ' disabled:opacity-40 disabled:cursor-not-allowed'
              }
            >
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm text-heading">
                  {selected ? <CircleCheck size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
                  {name}
                </span>
                <span className="font-mono text-xs text-muted">{hint}</span>
              </span>
              <span className={`text-xs ${installed ? (authed ? 'text-go' : 'text-hold') : 'text-muted'}`}>
                {installed ? (authed ? 'Ready' : 'Sign-in needed') : 'Not installed'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={handleTest} disabled={testing || !selectedAdapter || adapterTested}>
          {testing ? 'Testing…' : adapterTested ? 'Tested' : 'Test adapter'}
        </Button>
        {adapterTested ? <span className="text-xs text-go">Adapter works</span> : null}
        {testError ? <span className="text-xs text-signal">{testError}</span> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Update `OnboardingWizard.tsx`**

In `apps/desktop/renderer/src/features/onboarding/OnboardingWizard.tsx`:
- Replace the import `import { StepApiKey } from './steps/StepApiKey';` with `import { StepAdapter } from './steps/StepAdapter';`
- Change `const STEP_LABELS = ['Welcome', 'API Key', 'Proxy', 'Record'] as const;` to `const STEP_LABELS = ['Welcome', 'Adapter', 'Proxy', 'Record'] as const;`
- Change the gate line to consume `adapterReady`:

```tsx
  const { adapterReady, certTrusted } = useOnboarding();
  const [step, setStep] = React.useState(0);

  const gatePassed = step === 1 ? adapterReady : step === 2 ? certTrusted : true;
```

- Change the step-1 render line `{step === 1 ? <StepApiKey /> : null}` to `{step === 1 ? <StepAdapter /> : null}`

- [ ] **Step 10: Delete the old step and update the wizard test**

Delete `apps/desktop/renderer/src/features/onboarding/steps/StepApiKey.tsx`.

Replace `apps/desktop/renderer/src/features/onboarding/OnboardingWizard.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingProvider } from '../../store/onboarding.store';
import { OnboardingWizard } from './OnboardingWizard';

test('walks welcome → adapter → gates on selecting and testing an adapter', async () => {
  const onDone = vi.fn();
  render(
    <OnboardingProvider>
      <OnboardingWizard onDone={onDone} />
    </OnboardingProvider>
  );

  await userEvent.click(screen.getByRole('button', { name: /Get started/i }));

  // Adapter step: continue disabled until an adapter is selected and tested.
  const cont = screen.getByRole('button', { name: /Continue/i });
  expect(cont).toBeDisabled();

  // Detected adapters render as cards; pick Claude then test it.
  await userEvent.click(await screen.findByTestId('adapter-card-claude'));
  await userEvent.click(screen.getByRole('button', { name: /Test adapter/i }));
  expect(await screen.findByText(/Adapter works/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
});
```

- [ ] **Step 11: Run the renderer suite for onboarding + service**

Run: `cd apps/desktop && npx vitest run renderer/src/services/adapter.service.test.ts renderer/src/features/onboarding/OnboardingWizard.test.tsx renderer/src/App.test.tsx`
Expected: PASS (App.test still finds "Get started").

- [ ] **Step 12: Commit**

```bash
git add apps/desktop/renderer/src/types apps/desktop/renderer/src/services/adapter.service.ts apps/desktop/renderer/src/services/adapter.service.test.ts apps/desktop/renderer/src/store/onboarding.store.tsx apps/desktop/renderer/src/features/onboarding apps/desktop/renderer/src/test-setup.ts
git commit -m "feat(onboarding): adapter picker + backend test replacing API-key step"
```

---

## Task 4: Wire executions to the real adapter

**Depends on Task 3** (types, `adapter.service.ts`, and the global test bridge mock).

**Files:**
- Modify: `apps/desktop/renderer/src/services/execution.service.ts` (drive the real adapter)
- Modify: `apps/desktop/renderer/src/services/execution.service.test.ts` (assert event→summary mapping)
- Modify: `apps/desktop/renderer/src/store/executions.store.tsx` (pass adapter + runId, error path)

**Interfaces:**
- Consumes (from Task 3): `runAdapter`, `getSelectedAdapter` from `adapter.service.ts`; `AdapterId`, `AdapterEvent`, `RunStep` from `types`.
- Produces: `runTask(prompt, adapter, onLine, runId): Promise<string>` — resolves with the run summary, rejects on a terminal adapter error.

- [ ] **Step 1: Rewrite the failing test**

Replace `apps/desktop/renderer/src/services/execution.service.test.ts` with:

```ts
import type { RunStep } from '../types';
import { runTask } from './execution.service';

test('maps adapter events to RunSteps and resolves the summary', async () => {
  const steps: RunStep[] = [];
  const summary = await runTask('check staging', 'claude', (s) => steps.push(s), 'run-test-1');
  expect(steps.length).toBeGreaterThanOrEqual(2);
  expect(summary).toContain('re: "check staging"');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run renderer/src/services/execution.service.test.ts`
Expected: FAIL (`runTask` old signature returns before the new args exist / type error).

- [ ] **Step 3: Rewrite `execution.service.ts`**

Replace `apps/desktop/renderer/src/services/execution.service.ts` with:

```ts
import type { AdapterEvent, AdapterId, RunStep } from '../types';
import { runAdapter } from './adapter.service';

/**
 * Drives one adapter run for `prompt`, mapping streamed adapter events to
 * `RunStep`s via `onLine`, and resolving with the run summary. Rejects on a
 * terminal adapter error so the store can render a failed bubble.
 */
export function runTask(
  prompt: string,
  adapter: AdapterId,
  onLine: (step: RunStep) => void,
  runId: string
): Promise<string> {
  return runAdapter(runId, { adapter, prompt }, (event: AdapterEvent) => {
    if (event.type === 'status') {
      onLine({ label: event.label, status: 'active' });
    } else if (event.type === 'step') {
      onLine({ label: event.label, status: event.status });
    } else if (event.type === 'output') {
      onLine({ label: event.text, status: 'done' });
    }
  }).then((res) => {
    if (res.ok) return res.summary ?? 'Completed';
    throw new Error(res.error ?? 'Adapter run failed');
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npx vitest run renderer/src/services/execution.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Update `executions.store.tsx`**

In `apps/desktop/renderer/src/store/executions.store.tsx`:

- Update the import line `import { runTask } from '../services/execution.service';` to also import the adapter helper:

```tsx
import { runTask } from '../services/execution.service';
import { getSelectedAdapter } from '../services/adapter.service';
```

- Replace the tail of `send` (from the `const steps…` line to the end of the callback body, i.e. the current lines that call `runTask` and apply the final progress) with an adapter-driven run that handles errors:

```tsx
      const steps: NonNullable<ChatMessage['progress']> = [];
      const runId = `${targetId}-${Date.now()}`;
      try {
        const summary = await runTask(trimmed, getSelectedAdapter(), (step) => {
          steps.push(step);
          applyProgress([...steps]);
        }, runId);
        applyProgress([...steps], summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Adapter run failed';
        applyProgress([...steps], `⚠ ${message}`);
      }
```

(Everything above `const steps…` in `send` — the user/agent message creation and `applyProgress` helper — stays unchanged.)

- [ ] **Step 6: Run the executions-related suite**

Run: `cd apps/desktop && npx vitest run renderer/src/store renderer/src/services renderer/src/features/executions`
Expected: PASS (Conversation.test still matches `re: "check staging"` from the mock summary).

- [ ] **Step 7: Full suite + typecheck**

Run: `cd apps/desktop && npx vitest run && npx tsc -p tsconfig.json --noEmit`
Expected: all tests PASS; no type errors.

- [ ] **Step 8: Commit**

```bash
git add apps/desktop/renderer/src/services/execution.service.ts apps/desktop/renderer/src/services/execution.service.test.ts apps/desktop/renderer/src/store/executions.store.tsx
git commit -m "feat(executions): run a fresh adapter per task, streaming results into chat"
```

---

## Notes / follow-ups (out of scope for this plan)

- Richer streaming: consume `claude --output-format stream-json` / `codex` JSON to produce fine-grained `step` events instead of raw `output` lines.
- Cancellation UI: a "Stop" affordance in the conversation calling `cancelAdapter(runId)`.
- Packaging: bundle a Python interpreter and repoint `resolvePython()` / `runtimeDir()` at `resources/` for a shippable app.
