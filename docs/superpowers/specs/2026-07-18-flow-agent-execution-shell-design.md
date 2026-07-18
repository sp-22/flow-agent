# Flow Agent — Execution-first Shell + Flow Inspector — Design Spec

**Date:** 2026-07-18
**Branch:** `execution-open-ui`
**Status:** Approved for implementation planning

## 1. Summary

Restructure the Flow Agent desktop UI from a three-tab header layout
(`Record / Workflows / Executions`) into an **execution-first** app framed by a
**persistent, collapsible global sidebar**. The app opens (after the unchanged
onboarding flow) on a Gemini-style Home screen: a centered chat input with a
workflow list/grid beneath it. Entering a prompt transitions into an active
execution with the input pinned to the bottom, the agent's "thinking" animated,
and a clickable flow line that opens a right-side **flow inspector** rendering
the workflow's flowchart with the current step highlighted.

The product's display name is **Flow Agent** (the codebase currently renders
"WorkflowPilot"; this is corrected as part of this work).

## 2. Goals

- Remove the top header (`AppShell` header + `SegmentedTabs`).
- Introduce a global, collapsible left sidebar shared by the Execution and
  Workflow windows.
- Make **Execution the main window**, with Home = the Execution "new" state.
- Provide sidebar CTAs: **+ New Execution**, **Workflows**, **+ Create Workflow**.
- Show **recent** and **pinned** executions in the sidebar, plus a profile card
  at the bottom.
- Animate the agent's "thinking" during an active execution.
- Make the "thinking" flow line clickable, opening a right-side inspector that
  shows the workflow's Mermaid flowchart with the **current step highlighted**.
- Rename the displayed product name to **Flow Agent**.

## 3. Non-goals / Out of scope

- **Onboarding is untouched.** The 4-step first-run wizard and its first-run
  gate remain exactly as they are and continue to render before the shell.
- No changes to the mock-first architecture: all services remain timer-based
  stubs; no real mitmproxy/Claude/skill execution.
- No changes to the workflow split-pane editor internals (flow/code/runs/
  refactor panels) beyond framing it inside the new sidebar shell.

## 4. Confirmed decisions

| Topic | Decision |
| --- | --- |
| Sidebar toggle | **No toggle.** Sidebar holds plain CTAs/nav items. |
| Main window | **Execution** is the main window. |
| Home screen | Execution "new" state: centered chat input **plus** a workflow list/grid beneath it (Gemini-style), with a "+ Create" CTA above the grid. |
| Sidebar Recent/Pinned lists | **Always executions**, regardless of what the main window shows. |
| Workflows destination | Sidebar "Workflows" opens the existing full list/grid view (`WorkflowGrid`), with the editor still at `/workflows/:id`. |
| Flow inspector | **Right-side panel** that splits the conversation (conversation stays visible). Not a modal. |
| Inspector data | Canonical ordered step list per workflow in mock data; `activeIndex = number of done steps`. |
| Shell architecture | Keep `react-router`; sidebar items are `NavLink`s/actions. |
| Product name | **Flow Agent**. |

## 5. Deferred / open items (must remain explicit in the plan)

- **`+ Create Workflow` behavior is TBD.** It is intended to open the recording
  flow, but the exact entry experience is not yet decided.
- **Record flow entry point.** Because the `Record` tab is removed from the
  header and `Create Workflow` behavior is deferred, the Record flow's new home
  is deferred with it. Until decided, the existing `/record` route remains
  reachable (e.g. as the `Create Workflow` target) so no functionality is lost.

## 6. Architecture

### 6.1 Shell (Approach A — keep react-router)

- `AppShell` stops rendering the header/`SegmentedTabs`. Instead it renders a
  persistent `GlobalSidebar` on the left and `<main>` (routed content) on the
  right, in a full-height flex row.
- Routes are unchanged in spirit: `/executions` (main window / Home), and
  `/workflows` + `/workflows/:id`. `/record` remains reachable (see §5). The
  default route redirects to the Execution window.
- Sidebar items are `NavLink`s/actions:
  - **+ New Execution** → navigate to `/executions` and call `newTask()`.
  - **Workflows** → navigate to `/workflows`.
  - **+ Create Workflow** → open the recording flow (TBD; currently `/record`).
- This preserves all existing cross-tab hand-offs (`preload → navigate('/executions')`)
  and deep-linking to the workflow editor with minimal churn.

Rejected alternatives:
- **Mode-state shell (drop routing):** simpler mental model but rewires the
  editor open/close, the Record hand-off, and existing route-based tests for no
  real benefit. Higher regression risk.
- **Hybrid (toggle=state, editor=route):** two navigation mechanisms; avoided.

### 6.2 GlobalSidebar

Structure, top to bottom:

```
✦ Flow Agent                   ⟨⟩   ← brand + collapse toggle
[ + New Execution ]                  ← primary CTA
[ ▤ Workflows ]                      ← nav to /workflows
[ + Create Workflow ]                ← recording flow (TBD)
RECENT                               ← recent executions (from ExecutionsProvider)
  Deploy Check
  Is staging ok?
  Onboard · Acme
PINNED                               ← pinned executions
  ★ Deploy Check
─────────────
[ 👤 Gaurav ▾ ]  [◐] [● proxy] [● claude]   ← profile row: theme toggle + status dots relocate here
```

- **Collapsible:** an expanded state (~256px, labels visible) and a collapsed
  icon-rail state (~56px, icons only with hover tooltips). Collapse state is UI
  state held in the shell (a small `SidebarProvider`/context or local state);
  persistence to disk is not required for this iteration.
- The `proxy`/`claude` status dots and the theme toggle move out of the removed
  header into the profile row at the bottom of the sidebar.
- The existing `TaskSidebar` (recents list, rename/delete affordances) is
  refactored/absorbed into `GlobalSidebar` so there is a single sidebar; the
  recents/pinned rendering and its interactions are preserved.
- **Pinned** executions: introduce a `pinned` concept for tasks (a `pinnedIds`
  set or `pinned` flag) in `ExecutionsProvider`, with a pin/unpin affordance in
  the task row menu. Seed at least one pinned task so the section is populated
  for the demo.

### 6.3 Home (Execution "new" state)

- Rendered when the active execution has no messages (today's `NewTaskView`
  condition). Redesigned to a Gemini-style layout:
  - Heading (e.g. "Build your workflows").
  - Centered chat input (`PromptInput`), with `/`-mention still supported.
  - Beneath it: "Your workflows" section header with a **+ Create** CTA, and the
    workflow list/grid (reusing `WorkflowCard`), each card offering **▸ Run**.
- The workflow grid on Home and the dedicated `/workflows` view share the same
  card component and data source. Home is a quick-launch surface; `/workflows`
  is the full management view (search, editor access).
- Submitting a prompt transitions to the active execution view (§6.4) via the
  existing `send()` flow; the input relocates to the bottom.

### 6.4 Active execution + thinking

- The conversation thread is unchanged in structure: user/agent bubbles, input
  pinned at the bottom (`Conversation`).
- The agent bubble gains an animated **"Thinking…"** treatment while a run is in
  progress (streaming steps continue to render as today via `progress[]`).
- A **clickable flow line** appears in the agent bubble for runs tied to a
  workflow, e.g. `▸ Flow: Deploy Check (5 steps) ⟶`. Clicking it opens the flow
  inspector (§6.5) for that workflow/run.

### 6.5 Flow inspector (right-side panel)

- A right-side panel that splits the conversation area (conversation stays
  visible to its left); dismissible via a close control.
- Renders the target workflow's existing `mermaid` chart (reusing the `Mermaid`
  component) and highlights the **current step**.
- **Data model:** each workflow gains a canonical ordered step list in mock data
  (e.g. `steps: string[]` or a structured `{ label }[]`). The running execution
  is associated with a `workflowId`. The inspector computes
  `activeIndex = number of done steps` from the run's streamed `progress[]` and
  highlights that node; earlier nodes render as done, later nodes as pending.
- The Mermaid chart and the streamed steps stay in sync because they derive from
  the same canonical per-workflow step source.

Rejected alternative: deriving purely from streamed `progress[]` cannot show
upcoming (not-yet-reached) steps, so it fails the "7 steps, highlight #4"
requirement.

## 7. Data flow

- `ExecutionsProvider` remains the source of truth for tasks/executions. It
  gains: a `pinned` concept, and enough association between a running execution
  and its `workflowId` for the inspector to resolve the workflow + step list.
- `WorkflowsProvider` remains the source of truth for workflows; workflow mock
  data is enriched with the canonical ordered step list used by the inspector.
- Sidebar reads recent/pinned executions from `ExecutionsProvider`; Home and
  `/workflows` read workflows from `WorkflowsProvider`.

## 8. Components (new / changed)

**New**
- `GlobalSidebar` — persistent collapsible sidebar (brand, CTAs, recents,
  pinned, profile row with theme toggle + status dots).
- `FlowInspector` — right-side panel rendering the workflow flowchart with the
  active step highlighted.
- (Optional) `SidebarProvider`/context for collapse state, if not kept as local
  shell state.

**Changed**
- `AppShell` — drop header/`SegmentedTabs`; render `GlobalSidebar` + `<main>`.
- `App` routing — default to the Execution window; `/record` retained.
- `Conversation` / `NewTaskView` — Home redesign (chat input + workflow grid);
  animated thinking; clickable flow line; host the `FlowInspector`.
- `TaskSidebar` — absorbed into `GlobalSidebar` (recents + rename/delete + pin).
- `ExecutionsProvider` — pinned executions; run↔workflow association.
- Workflow mock data + types — canonical ordered step list per workflow.
- Global name strings — "WorkflowPilot" → "Flow Agent".

**Removed**
- `SegmentedTabs` (and the header block in `AppShell`).

## 9. Testing

- Keep existing route-based tests working (Approach A preserves routes).
- Update/replace `AppShell` tests and remove/repurpose `SegmentedTabs`
  expectations for the new sidebar.
- New tests:
  - Sidebar renders CTAs; **+ New Execution** starts a fresh execution;
    **Workflows** navigates to the grid; **+ Create Workflow** targets the
    recording flow.
  - Sidebar always lists executions (recents + pinned); pin/unpin works.
  - Sidebar collapse/expand toggles between labeled and icon-rail states.
  - Home renders the chat input + workflow grid; submitting a prompt transitions
    to the active execution with the input at the bottom.
  - Clicking the flow line opens the `FlowInspector`; the inspector highlights
    the correct active step for a given number of completed steps.
- Preserve `handoff.test.tsx` semantics (Run ▸ / Run in Console still pre-load
  the Execution input).

## 10. Design system compliance

- Clean Monochrome only: no gradients/glow/glassmorphism; color reserved for
  semantic signals (`--signal`/`--go`/`--hold`). Primary CTAs are high-contrast.
- Fonts: Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (code).
- Dark-mode default; light theme via the relocated toggle. The recording dot /
  signal-red remains the only warm focal accent.
