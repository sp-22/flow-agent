# Flow Agent — Execution-first Shell + Flow Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Apply the **frontend-design** skill and `design.md` tokens for all UI work.

**Goal:** Replace the three-tab header with an execution-first, sidebar-framed shell — Home = a chat input + workflow grid, an active-execution view with animated agent thinking, and a right-side flow inspector that highlights the current step of a running workflow.

**Architecture:** Keep `react-router` (Approach A): `AppShell` renders a persistent collapsible `GlobalSidebar` + routed `<main>`. Execution is the main window (`/executions`), Workflows stays at `/workflows` + `/workflows/:id`, `/record` remains reachable. A small data/state foundation task lands first; then two UI tasks run over disjoint file sets.

**Tech Stack:** Electron · Vite · React 18 · TypeScript (strict) · Tailwind (CSS custom-property tokens) · react-router-dom · lucide-react · mermaid · Vitest + React Testing Library.

## Global Constraints

- Product display name is **Flow Agent** (replace every UI occurrence of "WorkflowPilot").
- **Clean Monochrome** design system (`design.md`): no gradients, no glow shadows, no glassmorphism. Color only for semantic status: `--signal` #e5534b, `--go` #3fb950, `--hold` #d29922. Primary actions are high-contrast (`--text-high` bg, inverse text).
- Fonts: `Space Grotesk` (display/headings), `IBM Plex Sans` (body/controls), `IBM Plex Mono` (code/metadata). Use existing Tailwind aliases (`font-display`, `font-body`, `font-mono`) and token classes (`bg-base`, `bg-surface`, `bg-elevated`, `border-wire`, `text-muted`, `text-body`, `text-heading`, `text-high`).
- Dark theme default; the light-theme toggle must remain reachable.
- **Onboarding is untouched** — do not modify `features/onboarding/**` or the first-run gate in `App.tsx`.
- Mock-first: no real IO; keep all services timer-based stubs.
- **Do NOT run `git commit`** — implementers implement + run their targeted tests only. The controller collects commits for the human to approve.
- Existing tests must keep passing; update tests only where structure requires it. Run targeted tests with `npx vitest run <files>` from `apps/desktop`.
- Deferred (do NOT implement behavior; wire as a plain link to `/record`): **+ Create Workflow** opens the recording flow. Its final experience is out of scope.

---

### Task 1: Data & state foundation (steps, pinned, workflow association)

**Files:**
- Modify: `apps/desktop/renderer/src/types/index.ts`
- Modify: `apps/desktop/renderer/src/mock/workflows.ts`
- Modify: `apps/desktop/renderer/src/mock/tasks.ts`
- Modify: `apps/desktop/renderer/src/store/executions.store.tsx`
- Test: `apps/desktop/renderer/src/store/executions.store.test.tsx` (create)
- Test: `apps/desktop/renderer/src/mock/workflows.test.ts` (extend existing)

**Interfaces:**
- Produces (consumed by Tasks 2 & 3):
  - `Workflow.steps: string[]` — canonical ordered step labels for the flow inspector.
  - `Task.workflowId?: string` — the workflow a task/execution is running, when known.
  - `Task.pinned?: boolean` — whether the execution is pinned.
  - `ExecutionsContextValue` gains:
    - `pinnedTasks: Task[]` — tasks where `pinned === true`.
    - `recentTasks: Task[]` — non-pinned tasks (existing `tasks` stays as the full list).
    - `togglePin(id: string): void`.
    - `activeWorkflowId: string | null` — `active?.workflowId ?? null`.
  - `workflowIdForName(name: string): string | undefined` exported from `mock/workflows.ts` (case-insensitive match on `name`).

- [ ] **Step 1: Add fields to types.** In `types/index.ts` add `steps: string[];` to `Workflow`; add `workflowId?: string;` and `pinned?: boolean;` to `Task`.

- [ ] **Step 2: Add canonical steps to each seed workflow.** In `mock/workflows.ts`, add a `steps` array to each `SEED_WORKFLOWS` entry:
  - `deploy-check`: `['Fetch Latest GitHub Actions Run', 'Check Conclusion', 'Query Sentry Errors (24h)', 'Post Summary to Slack']`
  - `onboard-client`: `['Query Notion for New Clients', 'Create Welcome Notion Page', 'Send Welcome Email via Gmail']`
  - `price-monitor`: `['Fetch Product Page (Web)', 'Parse Current Price', 'Check Below Threshold', 'Send Alert Email (Gmail)']`
  Then add and export:
  ```ts
  export function workflowIdForName(name: string): string | undefined {
    const q = name.trim().toLowerCase();
    return SEED_WORKFLOWS.find((w) => w.name.toLowerCase() === q)?.id;
  }
  ```

- [ ] **Step 3: Seed pins + workflow links in mock tasks.** In `mock/tasks.ts`, set `workflowId: 'deploy-check'` on `task-1`, `workflowId: 'onboard-client'` on `task-3`, `workflowId: 'price-monitor'` on `task-4`; set `pinned: true` on `task-1`.

- [ ] **Step 4: Extend the executions store.** In `store/executions.store.tsx`:
  - Track pins in state initialized from seed: `pinned` derived from `task.pinned`. Simplest: keep a `Set<string>` of pinned ids seeded from `SEED_TASKS.filter(t => t.pinned).map(t => t.id)`.
  - Add `togglePin(id)` that adds/removes from the set.
  - Derive `pinnedTasks = tasks.filter(t => pinnedIds.has(t.id))` and `recentTasks = tasks.filter(t => !pinnedIds.has(t.id))`.
  - Add `activeWorkflowId = active?.workflowId ?? null`.
  - In `send()` and `preload()`, when the text starts with `/<name>`, resolve `workflowIdForName(name)` and store it on the finalized/draft task's `workflowId`.
  - Add all new fields to the context value + `useMemo` deps.

- [ ] **Step 5: Tests.** Add `store/executions.store.test.tsx`: render the provider via a test harness, assert `pinnedTasks` includes the seeded pinned task, `togglePin` moves a task between pinned/recent, and sending `"/Deploy Check run it"` sets `activeWorkflowId` to `'deploy-check'`. Extend `mock/workflows.test.ts` to assert every workflow has a non-empty `steps` array and `workflowIdForName('deploy check') === 'deploy-check'`.

- [ ] **Step 6: Run targeted tests.** `npx vitest run src/store/executions.store.test.tsx src/mock/workflows.test.ts` — expect PASS. Do not commit.

---

### Task 2: Global sidebar + shell restructure + rename (parallel wave)

**Files:**
- Create: `apps/desktop/renderer/src/components/GlobalSidebar.tsx`
- Modify: `apps/desktop/renderer/src/components/AppShell.tsx`
- Modify: `apps/desktop/renderer/src/App.tsx` (routing default only; DO NOT touch the onboarding gate)
- Delete: `apps/desktop/renderer/src/components/SegmentedTabs.tsx` and `components/SegmentedTabs.test.tsx`
- Delete: `apps/desktop/renderer/src/features/executions/TaskSidebar.tsx` (absorbed into `GlobalSidebar`)
- Modify (rename strings only): `apps/desktop/index.html` (`<title>`), root `product.md` header if it renders — actually only touch UI strings: `AppShell`/`GlobalSidebar` brand text.
- Test: `apps/desktop/renderer/src/components/AppShell.test.tsx` (update), `components/GlobalSidebar.test.tsx` (create)

**Interfaces:**
- Consumes from Task 1: `useExecutions()` → `recentTasks`, `pinnedTasks`, `togglePin`, `newTask`, `openTask`, `activeId`.
- Produces: `GlobalSidebar` (self-contained; rendered by `AppShell`). ExecutionsTab no longer renders a sidebar (Task 3 handles that).

**Design (apply frontend-design + design.md):**
- Persistent left sidebar, two states: **expanded** (~256px, labels) and **collapsed** icon-rail (~56px, icons + hover tooltips). Collapse state = local React state in the shell; a chevron/`PanelLeft` toggle flips it.
- Top: brand — `Flow Agent` wordmark (`font-display`) + existing `logo.png` (`filter: var(--logo-filter)`), and the collapse toggle.
- Primary CTA **+ New Execution** (`Button variant="primary"`, full width) → `newTask()` + navigate `/executions`.
- Nav item **Workflows** (`NavLink` to `/workflows`, active = `bg-elevated text-heading`).
- Secondary CTA **+ Create Workflow** (`Button variant="secondary"`) → `NavLink`/navigate to `/record` (deferred behavior).
- **RECENT** section: `recentTasks` list (reuse the row markup/rename+delete+`MoreHorizontal` menu from the old `TaskSidebar`, and add a **Pin** action calling `togglePin`). Clicking a row → `openTask(id)` + navigate `/executions`. Active row = `bg-elevated`.
- **PINNED** section: `pinnedTasks` rendered above or below RECENT with a ★ marker; unpin via the row menu.
- Bottom profile row: a profile card (`👤` avatar circle + name "Gaurav" + chevron) with the **theme toggle** (`Sun`/`Moon`, moved out of the old header) and the `proxy`/`claude` `StatusDot`s inline (moved out of the old header). No shadows.
- Collapsed rail: show only icons for New Execution (+), Workflows, Create Workflow, recent/pinned items (first-letter or dot with tooltip), theme toggle, profile avatar.
- Keep the macOS drag region behavior where the sidebar top area is draggable (`WebkitAppRegion: 'drag'`) with interactive controls `no-drag`.

- [ ] **Step 1: Write GlobalSidebar tests.** In `components/GlobalSidebar.test.tsx`, render within `MemoryRouter` + `ExecutionsProvider` + `ThemeProvider` (+ `WorkflowsProvider` if needed). Assert: brand text "Flow Agent" present; "+ New Execution" button present; a "Workflows" link with `href` containing `/workflows`; recent task titles render; a pinned task shows in a Pinned section; clicking the collapse toggle hides the labels (e.g. label text no longer visible / `data-collapsed` attribute set).

- [ ] **Step 2: Run tests to confirm they fail** (`GlobalSidebar` not created). `npx vitest run src/components/GlobalSidebar.test.tsx` → FAIL.

- [ ] **Step 3: Implement `GlobalSidebar`** per the Design section. Reuse `Button`, `StatusDot`, `useTheme`, `useExecutions`, `NavLink`. Absorb the recents row interactions from the old `TaskSidebar` (rename/delete local-only, plus the new Pin action). Add a `data-collapsed` attribute to the root for testability.

- [ ] **Step 4: Restructure `AppShell`.** Remove the `<header>` block and the `SegmentedTabs` import. Render a flex row: `<GlobalSidebar collapsed={c} onToggle={…} />` + `<main className="flex-1 overflow-auto">{children}</main>`. Move theme toggle + status dots into the sidebar (already done in Step 3), so `AppShell` no longer renders them.

- [ ] **Step 5: Update routing default in `App.tsx`.** Change the index redirect from `/workflows` to `/executions` (`<Navigate to="/executions" replace />`). Keep `/record`, `/workflows/*`, `/executions` routes and the onboarding gate exactly as-is.

- [ ] **Step 6: Rename to Flow Agent + delete SegmentedTabs.** Replace brand strings ("WorkflowPilot" → "Flow Agent") in the shell/sidebar and `index.html` `<title>`. Delete `SegmentedTabs.tsx` + `SegmentedTabs.test.tsx` and `features/executions/TaskSidebar.tsx`.

- [ ] **Step 7: Update `AppShell.test.tsx`.** Remove header/tab expectations; assert the sidebar renders (brand "Flow Agent", "+ New Execution") and that `children` render in `<main>`.

- [ ] **Step 8: Run targeted tests.** `npx vitest run src/components/GlobalSidebar.test.tsx src/components/AppShell.test.tsx` → PASS. Do not commit.

---

### Task 3: Home redesign + active-execution thinking + Flow Inspector (parallel wave)

**Files:**
- Modify: `apps/desktop/renderer/src/features/executions/ExecutionsTab.tsx` (render `Conversation` only; sidebar is now global)
- Modify: `apps/desktop/renderer/src/features/executions/Conversation.tsx`
- Modify: `apps/desktop/renderer/src/features/executions/NewTaskView.tsx`
- Modify: `apps/desktop/renderer/src/features/executions/ChatMessage.tsx`
- Create: `apps/desktop/renderer/src/features/executions/FlowInspector.tsx`
- Test: update `NewTaskView.test.tsx`, `Conversation.test.tsx`; create `FlowInspector.test.tsx`
- May reuse (read-only): `features/workflows/WorkflowCard.tsx`, `components/Mermaid.tsx`, `components/StepStatusIcon.tsx`, `PromptInput`, `WorkflowChips`.
- Do NOT edit `TaskSidebar.tsx`, `AppShell.tsx`, `App.tsx`, `GlobalSidebar.tsx` (Task 2 owns those).

**Interfaces:**
- Consumes from Task 1: `Workflow.steps`, `Task.workflowId`, `useExecutions().activeWorkflowId`, `useWorkflows().getById`.

**Design (apply frontend-design + design.md):**

- **Home / New Execution (`NewTaskView`)** — Gemini-style, replacing the current centered-hero layout:
  - Heading (`font-display`, e.g. "Build your workflows").
  - Centered chat input (`PromptInput`) with `/`-mention support (unchanged submit via `send`).
  - Below the input: a "Your workflows" section header with a **+ Create** button (navigate `/record`), then a responsive grid of `WorkflowCard`s (reuse the component) offering **Run** (call `preload(name)` + navigate `/executions`, matching the existing grid hand-off) and open (navigate `/workflows/:id`).
  - Keep `WorkflowChips` as a quick-launch row if it fits; otherwise fold into the grid.
- **Active execution (`Conversation` + `ChatMessage`)**:
  - Input stays pinned at the bottom (existing structure).
  - While the latest agent message is running (has `progress` with an `active` step and no final text yet), show an animated **"Thinking…"** treatment (e.g. the breathing `RecordingDot` cadence or a pulsing sparkle — reuse the 3s breathing keyframe from `design.md`; respect `prefers-reduced-motion`).
  - When the active execution has a `workflowId`, render a **clickable flow line** in the agent bubble: `▸ Flow: <workflow name> (<n> steps)` styled as a button (`font-mono text-xs`, hover → `text-heading`). Clicking calls a callback that opens the `FlowInspector` for that workflow.
- **FlowInspector** — right-side panel that splits the conversation (conversation stays visible on the left; panel ~360–420px, `border-l border-wire bg-surface`, close `✕`):
  - Header: workflow name + close button.
  - Body: render the workflow's `mermaid` chart via the existing `Mermaid` component, and beneath it an ordered step list from `workflow.steps` where the **current step is highlighted**. `activeIndex` = number of `done` steps in the active run's latest agent `progress` (`active` step = `activeIndex`). Steps `< activeIndex` = done (`text-go`/check), step `=== activeIndex` = active (`text-high`, with the breathing dot), steps `> activeIndex` = pending (`text-muted`). Reuse `StepStatusIcon`.

- [ ] **Step 1: Write FlowInspector test.** In `FlowInspector.test.tsx`, render `<FlowInspector workflow={deployCheck} activeIndex={1} onClose={fn} />` (import a seed workflow). Assert: workflow name renders; all 4 step labels render; the step at index 1 has `data-status="active"`, index 0 `done`, indices 2–3 `pending`; clicking the close control calls `onClose`. Mock `../../components/Mermaid` to a stub to avoid real mermaid rendering in jsdom.

- [ ] **Step 2: Run test to confirm it fails.** `npx vitest run src/features/executions/FlowInspector.test.tsx` → FAIL.

- [ ] **Step 3: Implement `FlowInspector`** per Design. Props: `{ workflow: Workflow; activeIndex: number; onClose: () => void }`. Render header, mocked-friendly `Mermaid`, and the highlighted step list with `data-status` on each row.

- [ ] **Step 4: Wire the clickable flow line in `ChatMessage`.** Add an optional `onOpenFlow?: () => void` and a `workflowName?`/`stepCount?` prop (or pass a small `flow` object). When present and the message is an agent run, render the clickable `▸ Flow: …` line that calls `onOpenFlow`. Add the animated "Thinking…" treatment for in-progress agent messages.

- [ ] **Step 5: Host the inspector in `Conversation`.** Add local state `inspectorOpen`. When the active task has `activeWorkflowId`, pass `onOpenFlow` to the relevant `ChatMessage`. Render `<FlowInspector>` to the right (flex row) when open, resolving the workflow via `useWorkflows().getById(activeWorkflowId)` and computing `activeIndex` from the latest agent message's `progress`.

- [ ] **Step 6: Redesign `NewTaskView`** into the Home layout (chat input + workflow grid + Create). Reuse `WorkflowCard`, `PromptInput`, `useWorkflows`, `useExecutions` (`preload`), and `useNavigate`.

- [ ] **Step 7: Simplify `ExecutionsTab`.** Render only `<Conversation />` inside a full-height container (the sidebar is global now). Remove the `TaskSidebar` import.

- [ ] **Step 8: Update tests.** Update `NewTaskView.test.tsx` (assert chat input + at least one workflow card render + a "Create" affordance). Update `Conversation.test.tsx` (thread still renders; opening the flow line shows the inspector — may need `ExecutionsProvider`/`WorkflowsProvider` wrappers and a task with `workflowId`).

- [ ] **Step 9: Run targeted tests.** `npx vitest run src/features/executions/` → PASS. Do not commit.

---

## Integration (controller, after Tasks 2 & 3)

- [ ] Run the full suite + typecheck from `apps/desktop`: `npx vitest run` and `npx tsc -p tsconfig.json --noEmit`. Fix any cross-task integration breakage (dispatch a focused fix subagent if needed).
- [ ] Report status to the human and ask before committing (per the no-commit constraint).

## Self-Review notes

- **Spec coverage:** header removal + rename (Task 2); global collapsible sidebar w/ toggle, CTAs, recent+pinned executions, profile card, relocated theme toggle/status dots (Task 2); Execution-as-main + Home chat input + workflow grid (Task 3); active-execution thinking animation + clickable flow line (Task 3); right-side flow inspector with current-step highlight backed by canonical steps (Tasks 1+3); onboarding untouched (constraint). Deferred items (Create Workflow behavior, Record entry) wired as a link to `/record`.
- **Parallel safety:** Task 2 and Task 3 touch disjoint files; Task 1 lands first so both consume its interfaces from the shared working tree. Implementers run only their targeted test files; the controller runs the full typecheck at integration.
- **Type consistency:** `steps`, `workflowId`, `pinned`, `pinnedTasks`, `recentTasks`, `togglePin`, `activeWorkflowId`, `workflowIdForName` are named identically across Tasks 1→2→3.
