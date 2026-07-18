# CLI Adapter Runtime — Design Spec

**Date:** 2026-07-18
**Branch:** `feat/cli-adapter-runtime`
**Status:** Draft for review

## 1. Summary

Replace the mock "API key" onboarding step and the timer-based execution stub with a
real **CLI adapter runtime**. An *adapter* is a thin wrapper that drives an agentic
coding CLI — **Claude Code** (`claude`) or **OpenAI Codex** (`codex`) — headlessly and
normalizes its output into a single event stream the UI already understands.

Two user-facing touch points:

1. **Onboarding** — instead of pasting an API key, the user picks an adapter. The app
   auto-detects which CLIs are installed/authenticated in the backend, pre-selects what
   it finds, shows both as cards with live status, and offers a **"Test adapter"** button
   that runs a real backend probe.
2. **Executions** — each new task spawns a **fresh adapter process** in the backend that
   runs the user's prompt headlessly and streams progress/output back into the chat
   thread in real time.

Authentication is delegated entirely to the CLIs' own logins (`claude login` /
`codex login`); no key is ever entered in-app.

## 2. Goals

- Detect installed & authenticated `claude` / `codex` CLIs from the backend.
- Onboarding adapter selection + real backend test probe, replacing the API-key step.
- Per-task execution: spawn a new adapter process per task, stream normalized events into
  the chat, support cancellation.
- A real, embedded **Python backend** (`services/flow-runtime`) invoked by Electron's
  main process; streaming over **stdout (JSON-lines) → Electron IPC → renderer**.
- Keep the Vitest suite green by mocking the Electron bridge in tests.

## 3. Non-goals

- Browser-only (`npm run dev`) functional parity — the feature is **Electron-only**. In a
  pure browser context the adapter surface reports "backend unavailable"; we do **not**
  keep the old timer mock as a runtime fallback.
- Persistent/interactive multi-turn sessions bound to one adapter process (each send is a
  fresh headless run). May be revisited later.
- Running against generated workflow skills (the `/workflow` mention still prefixes the
  prompt text, but the adapter just receives the resulting prompt string).
- Production packaging of the Python interpreter (PyInstaller/py2app). We document the
  bundling seam but dev + this branch resolve a system/venv Python.

## 4. Architecture

```
┌──────────────┐   IPC (invoke/handle + events)   ┌───────────────────────┐
│  Renderer    │ <──────────────────────────────> │  Electron main        │
│  (React)     │                                   │  AdapterManager       │
│  services/   │   window.flowAgent.adapter        │  - detect/test/run    │
│  adapter.*   │        (preload bridge)           │  - spawns python      │
└──────────────┘                                   │  - parses JSONL stdout│
                                                    └───────────┬───────────┘
                                                                │ child_process
                                                                ▼
                                              ┌───────────────────────────────┐
                                              │  Python  flow_runtime (CLI)    │
                                              │  detect | test | run           │
                                              │  wraps claude / codex CLIs     │
                                              │  emits unified JSONL on stdout │
                                              └───────────────┬───────────────┘
                                                              │ subprocess
                                                              ▼
                                                    claude -p … / codex exec …
```

**Process model (Approach A):** short-lived Python subprocess per action. One process for
`detect`, one for each `test`, one per execution task `run`. The process emits JSONL on
stdout and exits when done. Main tracks run processes by `runId` for cancellation. No
long-lived backend state.

### 4.1 Components

- **`services/flow-runtime` (Python package `flow_runtime`)** — the backend. A CLI with
  three subcommands (`detect`, `test`, `run`) plus per-adapter wrapper modules that know
  how to invoke each CLI and translate its native output into our unified event schema.
- **Electron main `AdapterManager`** — resolves the Python executable, spawns subprocesses,
  reads stdout line-by-line, parses each line as a JSON event, and bridges to the renderer
  (request/response for `detect`/`test`, streaming events for `run`). Owns process
  lifecycle + cancellation.
- **Preload bridge** — `contextBridge` exposes a typed `window.flowAgent.adapter` API.
- **Renderer services** — `adapter.service.ts` (detect/test) and an updated
  `execution.service.ts` (`runTask` now drives a real adapter run, mapping events to the
  existing `RunStep` shape so `executions.store` is largely unchanged).

## 5. Adapter contract (unified JSONL protocol)

Every backend subcommand writes **one JSON object per line** to stdout. The process exit
code is authoritative for success/failure; the terminal event carries the summary.

```jsonc
// discovery (detect)
{"type":"detect","adapters":[
  {"id":"claude","installed":true,"authenticated":true,"version":"1.x"},
  {"id":"codex","installed":false,"authenticated":false,"version":null}
]}

// streaming (test / run)
{"type":"status","label":"Gathering context"}      // coarse phase → RunStep(active)
{"type":"step","label":"Query API","status":"done"} // discrete step → RunStep(done)
{"type":"output","text":"…assistant text chunk…"}   // streamed model/tool text
{"type":"result","ok":true,"summary":"…"}           // terminal success
{"type":"error","message":"…","code":"NOT_AUTHED"}  // terminal failure
```

- `code` values (errors): `NOT_INSTALLED`, `NOT_AUTHED`, `SPAWN_FAILED`, `CANCELLED`,
  `RUNTIME_ERROR`.
- The renderer maps `status`/`step` events to `RunStep` entries and accumulates `output`
  text into the agent chat bubble; `result.summary` becomes the final message text.

### 5.1 Backend CLI surface

```
python -m flow_runtime detect
python -m flow_runtime test  --adapter <claude|codex>
python -m flow_runtime run   --adapter <claude|codex> [--cwd <path>]   # prompt via stdin
```

- **detect** — `shutil.which` for each binary; a lightweight auth check per adapter
  (parse CLI config / a fast `--version`-class call). Emits one `detect` event, exits 0.
- **test** — runs a minimal headless prompt (e.g. "reply READY") through the selected
  adapter, streaming events; exits 0 on a `result`, non-zero on `error`.
- **run** — reads the prompt from **stdin** (avoids arg-length/escaping issues), invokes
  the adapter headlessly, and streams normalized events until the CLI finishes.

### 5.2 Per-adapter wrappers

- **Claude Code:** `claude -p <prompt> --output-format stream-json --verbose` — consume its
  streaming JSON and map to the unified schema.
- **Codex:** `codex exec <prompt>` with JSON output where available; otherwise wrap
  line-oriented stdout as `output` events and synthesize a terminal `result`.
- Each wrapper is a small module implementing a common interface
  (`detect() -> AdapterInfo`, `test() -> events`, `run(prompt, cwd) -> events`) so adding a
  third adapter later is isolated.

## 6. Electron main — AdapterManager

- **Python resolution order:** `FLOW_RUNTIME_PYTHON` env → bundled interpreter path (future)
  → `services/flow-runtime/.venv/bin/python` → `python3` on PATH. Working dir set to the
  `flow-runtime` package root.
- **IPC channels:**
  - `adapter:detect` (invoke/handle) → resolves `AdapterInfo[]`.
  - `adapter:test` (invoke/handle, arg `{adapter}`) → resolves `{ok, summary?, error?}`.
  - `adapter:run:start` (invoke/handle, arg `{runId, adapter, prompt, cwd?}`) → spawns,
    returns once started; streams via `adapter:run:event` (`{runId, event}`) sent to the
    calling `webContents`; a final `adapter:run:event` with a terminal `result`/`error`.
  - `adapter:run:cancel` (send, arg `{runId}`) → kills the tracked child (SIGTERM →
    SIGKILL fallback), emits a terminal `error{code:"CANCELLED"}`.
- **Line parsing** is extracted into a pure, unit-testable function
  (`parseAdapterLine(line) -> AdapterEvent | null`) that tolerates non-JSON noise lines
  (logged, skipped).
- Stderr from the child is captured and, on non-zero exit without a terminal event,
  surfaced as `error{code:"RUNTIME_ERROR", message: <tail of stderr>}`.

## 7. Preload bridge

`contextBridge.exposeInMainWorld('flowAgent', { platform, adapter })` where `adapter`:

```ts
interface AdapterBridge {
  detect(): Promise<AdapterInfo[]>;
  test(adapter: AdapterId): Promise<AdapterTestResult>;
  run(runId: string, args: { adapter: AdapterId; prompt: string; cwd?: string },
      onEvent: (e: AdapterEvent) => void): Promise<AdapterRunResult>;
  cancel(runId: string): void;
}
```

`run` subscribes to `adapter:run:event` filtered by `runId`, forwards each event to
`onEvent`, and resolves on the terminal event (cleaning up the listener).

## 8. Renderer changes

### 8.1 Types (`types/index.ts`)
Add `AdapterId = 'claude' | 'codex'`, `AdapterInfo`, `AdapterEvent`, `AdapterTestResult`,
`AdapterRunResult`.

### 8.2 Onboarding
- **Store (`onboarding.store.tsx`):** replace `apiKeyVerified`/`verifyApiKey` with
  `detectedAdapters: AdapterInfo[]`, `selectedAdapter: AdapterId | null`,
  `adapterTested: boolean`, `detectAdapters()`, `selectAdapter(id)`, `testAdapter()`.
  Persist the chosen adapter (localStorage key `workflowpilot:adapter`). The onboarding
  completion gate becomes "an adapter is selected **and** tested".
- **Step (`steps/StepApiKey.tsx` → `steps/StepAdapter.tsx`):** on mount call
  `detectAdapters()`; render two cards (Claude, Codex) with installed/authenticated status,
  pre-select the first detected working adapter, allow switching, and a **Test adapter**
  button that calls `testAdapter()` and shows pass/fail. Update `OnboardingWizard`
  step label `API Key` → `Adapter` and its gate (`step === 1 ? adapterReady`).

### 8.3 Executions
- **`services/execution.service.ts`:** `runTask` gains the selected adapter + a `runId` and
  drives the real adapter via `window.flowAgent.adapter.run(...)`, mapping `status`/`step`
  events to `RunStep` via the existing `onLine` callback and resolving with `result.summary`
  (or rejecting on a terminal `error`, so the store can show an error bubble). Signature
  evolves to `runTask(prompt, adapter, onLine, runId?) => Promise<string>`.
- **`store/executions.store.tsx`:** read `selectedAdapter` from onboarding; generate a
  `runId` per send; pass through to `runTask`. "New Task" continues to create a fresh task;
  each send is a fresh adapter run ("each new task creates a new adapter"). Add an error
  path that renders a failed agent bubble when a run errors. Optional cancel hook wired to
  `adapter.cancel(runId)`.
- When no backend bridge is present (browser dev / missing), the service throws a
  `BACKEND_UNAVAILABLE` error surfaced as a clear message in the chat.

## 9. Error handling

- **Not installed / not authenticated:** surfaced in onboarding cards (disabled Test, hint
  to run `claude login` / install the CLI) and, at run time, as an error bubble.
- **Spawn failure / bad Python:** `SPAWN_FAILED` with the resolved interpreter path in the
  message.
- **Cancellation:** user-initiated kill emits terminal `CANCELLED`; UI marks the run
  stopped.
- **Malformed output:** non-JSON stdout lines are skipped/logged, never crash the parser.

## 10. Testing strategy

- **Python (`pytest`):** `detect` JSON shape; event normalization for each wrapper using a
  **fake CLI** on PATH (a stub script emitting known output); `run` reads stdin and emits a
  terminal event; error paths (missing binary, non-zero exit).
- **Electron main:** unit-test the pure `parseAdapterLine` and the stderr→error fallback.
- **Renderer (Vitest):** mock `window.flowAgent.adapter` in `test-setup`/per-test. Update
  onboarding tests (detect → select → test → gate) and executions tests (event → RunStep →
  summary, plus error path). Existing tests updated to the new bridge instead of timers.

## 11. Packaging / embedding (documented seam, not built here)

`FLOW_RUNTIME_PYTHON` + a resolver function isolate interpreter discovery so a later change
can point at a bundled interpreter (PyInstaller one-file or a shipped venv under
`resources/`) without touching call sites. `services/flow-runtime` gets a `pyproject.toml`
(package `flow_runtime`, console entry `flow-runtime`) and a `.venv` for dev.

## 12. File-by-file change list

**New — Python backend**
- `services/flow-runtime/pyproject.toml`
- `services/flow-runtime/src/flow_runtime/__init__.py`
- `services/flow-runtime/src/flow_runtime/__main__.py`
- `services/flow-runtime/src/flow_runtime/cli.py` (argparse: detect/test/run)
- `services/flow-runtime/src/flow_runtime/events.py` (unified event dataclasses + JSONL emit)
- `services/flow-runtime/src/flow_runtime/adapters/base.py` (Adapter interface)
- `services/flow-runtime/src/flow_runtime/adapters/claude.py`
- `services/flow-runtime/src/flow_runtime/adapters/codex.py`
- `services/flow-runtime/src/flow_runtime/adapters/registry.py` (id → adapter)
- `services/flow-runtime/tests/…` (pytest + fake-CLI fixtures)

**New — Electron**
- `apps/desktop/electron/main/adapter-manager.ts`
- `apps/desktop/electron/main/adapter-protocol.ts` (`parseAdapterLine`, event types)

**Modified — Electron**
- `apps/desktop/electron/main/main.ts` (register AdapterManager IPC)
- `apps/desktop/electron/preload/preload.ts` (expose `adapter` bridge)

**New — Renderer**
- `apps/desktop/renderer/src/services/adapter.service.ts`
- `apps/desktop/renderer/src/features/onboarding/steps/StepAdapter.tsx`

**Modified — Renderer**
- `renderer/src/types/index.ts` (adapter types)
- `renderer/src/store/onboarding.store.tsx`
- `renderer/src/features/onboarding/OnboardingWizard.tsx`
- `renderer/src/services/execution.service.ts`
- `renderer/src/store/executions.store.tsx`
- Tests: `OnboardingWizard.test.tsx`, `execution.service.test.ts`, plus a new
  `adapter.service` test and shared bridge mock in `test-setup.ts`.
- Remove `steps/StepApiKey.tsx` (replaced by `StepAdapter.tsx`).

## 13. Risks / open questions

- **CLI output stability:** `claude`/`codex` JSON formats differ and evolve; wrappers must
  be defensive and fall back to treating stdout as `output` text.
- **Auth detection accuracy:** determining "authenticated" without a paid call — we use the
  cheapest reliable signal per CLI and rely on the explicit **Test** probe for certainty.
- **Vitest bridge mocking:** all renderer tests must provide the `window.flowAgent.adapter`
  mock; a shared helper keeps this DRY.
