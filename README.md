# Flow Agent

A premium, desktop-native developer utility that turns manual actions into reusable automations on a **"record once, automate forever"** paradigm: you narrate a task while performing it, Flow Agent captures the underlying API traffic, Claude generates a clean Python skill, and you run or chain those skills through an autonomous agent console. Built with Electron + React (Vite), TypeScript, and a Clean Monochrome design system.

## ⚠️ Mock-first build

This repository is a **UI-complete, mock-first** implementation. Everything the three tabs and onboarding need to demo is present and interactive, but the external integrations are **stubbed** — there is:

- **no real mitmproxy** — recording is voice/UI theatre driven by timer-based stubs;
- **no real Claude API** — skill "generation" and refactor "diffs" return canned data;
- **no real skill execution** — the agent console streams simulated progress and canned summaries.

All stubs live in `src/renderer/services/` and resolve canned data over short `setTimeout`s so loaders and streams animate realistically. Wiring real backends means replacing those service modules; the UI already consumes them through stable interfaces.

## What's implemented

- **Onboarding** — 4-step first-run wizard (welcome → Claude API key → proxy/cert → record), with a first-run gate.
- **Record tab** — mic-check setup, an ambient recording overlay (signal-red screen border + a floating Whisper-Flow-style pill with the breathing recording dot), and a plain-language "building" screen that hands the new draft to the editor.
- **Workflows tab** — a rich-card grid (View A) and a split-pane editor (View B) with a Mermaid flowchart, a `skill.py` / `manifest.yaml` code viewer, recent runs, a refactor chat with inline diffs, and a post-recording "first-look" state.
- **Executions tab** — a Cursor-style agent console: task sidebar (recent-first), a New Task view with suggestion cards + quick-use chips + `/`-mention autocomplete, and a normal chat thread that streams autonomous run progress.
- **Cross-tab hand-offs** — finishing a recording lands in the editor first-look; **Run ▸ / Run in Console** pre-load the workflow into the Executions input.
- Dark-mode default with a light-theme toggle (top-right of the title bar).

## Commands

```bash
npm install          # install dependencies

npm run dev          # Vite dev server (open the printed URL in a browser to develop the UI fast)
npm test             # run the Vitest suite (headless)
npm run test:watch   # watch mode

npm run build        # typecheck + build the Electron main process (dist-electron/) + bundle the renderer (dist/)
npm run electron:dev # build, then launch the Electron desktop window
```

### Two-terminal Electron dev (live reload)

```bash
# terminal 1 — renderer dev server
npm run dev

# terminal 2 — build the main process, then launch Electron pointed at the dev server
npm run build:electron-main
VITE_DEV_SERVER_URL=http://localhost:5173 npx electron .
```

`electron/main.ts` loads `VITE_DEV_SERVER_URL` when set (live reload) and otherwise falls back to the built `dist/index.html`.

## Manual smoke test

1. `npm run build && npm run electron:dev` — the window opens on **onboarding** (first run).
2. Complete onboarding (verify API key → verify cert → "Record your first workflow") → lands on the **Record** tab.
3. Mic check passes → **Start Recording** → the ambient overlay appears → **Stop** → the plain-language build screen runs → you land in the **Workflows editor first-look** for the new draft.
4. **Save** the draft → it becomes a normal grid card.
5. From a card, click **Run ▸** (or **Run in Console** in the editor) → the **Executions** tab opens with the workflow pre-loaded → send it and watch the agent stream progress.
6. Toggle the theme (◐, top-right) and confirm both dark and light render correctly.

## Project references

- **UX spec:** `docs/superpowers/specs/2026-07-17-flow-agent-ux-design.md`
- **Design system:** `design.md` (tokens) and `design-system.html` (living reference — open in a browser)
- **Implementation plan:** `docs/superpowers/plans/2026-07-17-flow-agent-ui.md`

## Tech stack

Electron · Vite · React 18 · TypeScript (strict) · Tailwind CSS (tokens via CSS custom properties) · react-router · mermaid · Vitest + React Testing Library.
