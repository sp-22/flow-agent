# Workflow View — Flow Canvas & On-Demand Refactor

**Date:** 2026-07-18  
**Route:** `/#/workflows/:id` (Flow tab)  
**Status:** Approved approach A — awaiting user review of this spec  
**References:** `design.md`, screenshot (Deploy Check flow + Refactor sidebar), `/frontend-design`

## Summary

Replace the Mermaid-only Flow tab with a custom React flow canvas that uses semantic and service accent color for readability. Keep the Refactor panel **closed by default** and open it from a **+ Refactor** CTA. Selecting a flow step inserts a removable **@step chip** into the Refactor composer so edits target that component.

## Goals

1. Flow diagram is scannable: node kinds, services, branch outcomes, and selection are visually distinct.
2. Refactor is on-demand — full-width Flow by default; panel opens from the CTA.
3. Selecting a node focuses Refactor on that step via a chip in the composer (screenshot behavior).
4. Stay aligned with WorkflowPilot’s clean monochrome system (`design.md`); do not adopt screenshot purple chrome.

## Non-Goals

- Full graph editor (drag-to-rewire, freeform layout tools, zoom/pan productization beyond a simple scrollable canvas).
- Replacing Mermaid in Code/other surfaces — Mermaid strings may remain on the workflow model for Code/export; Flow tab uses structured nodes.
- Real AI refactor backend changes (keep timer stub; optionally pass selected step label in the instruction prefix).
- Redesigning Code / Runs tabs beyond what’s needed to host the Refactor CTA in the editor chrome.

## Current State

- `WorkflowEditor` always mounts a 360px `RefactorChat` beside the spec pane.
- Flow tab renders `SpecFlow` → `Mermaid` from `workflow.mermaid` (monochrome theme variables).
- Nodes are not selectable; Refactor has no step chip.
- Tests expect Refactor placeholder visible on editor mount (`WorkflowEditor.test.tsx`).

## Design System Mapping (screenshot → design.md)

| Screenshot cue | WorkflowPilot treatment |
|----------------|-------------------------|
| Purple primary / chips | High-contrast primary (`--text-high` bg) and elevated chip with wire border + heading text — **no purple brand accent** |
| Blue selection ring | `border-hover` / `text-high` 2px ring on selected node |
| Green “Passed” / No path / End | `--go` (`#3fb950`) |
| Orange “Yes” branch edge | `--hold` (`#d29922`) |
| Service left rail (GitHub / Sentry / Slack) | Existing brand colors from `ServiceLogo` (same earned exception as workflow cards) |
| Light grid canvas | Subtle dotted/grid using `--border-wire` on `--bg-base` / `--bg-surface` |
| Typography | Space Grotesk titles · IBM Plex Sans body · IBM Plex Mono eyebrows / meta |

**Signature element:** `@Step name` chip in the Refactor composer when a node is selected.

## Information Architecture

```
WorkflowEditor
├─ Header (name, health, Run in Console, Run, [+ Refactor])
├─ Spec pane (tabs: Flow | Code | Runs)
│   └─ Flow → FlowCanvas (custom nodes + edges)
└─ Refactor panel (optional, w-[360px], closed by default)
    └─ RefactorChat (composer with optional StepChip)
```

When Refactor is closed, the spec pane is full width. When open, restore the current split (spec | 360px panel).

## Data Model

Introduce structured flow data (seeded per workflow). Mermaid may remain for backward compatibility / Code views but is **not** the Flow tab source of truth.

```ts
export type FlowNodeKind = 'trigger' | 'action' | 'branch' | 'end';

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  title: string;           // e.g. "Query errors (last 24h)"
  subtitle?: string;       // e.g. "Project: api-prod"
  service?: ServiceName;   // drives logo + left accent
  status?: 'passed' | 'failed' | 'idle';
  durationLabel?: string;  // e.g. "0.6s"
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;          // "Yes" | "No" | …
  tone?: 'neutral' | 'go' | 'hold' | 'signal';
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

Attach `flow: FlowGraph` to each seeded `Workflow` (at minimum `deploy-check`, mirroring the screenshot; other workflows get equivalent graphs from their current Mermaid steps).

## UI Spec

### 1. Flow canvas (`FlowCanvas`)

- Scrollable canvas with quiet grid background (wire dots or light grid — no gradients/glow).
- Layout: left-to-right (or top-to-bottom on narrow widths) using fixed positions or a simple layered flex/grid for the seeded graphs — **no new graph-layout library** unless unavoidable; prefer explicit positions for seed graphs.
- **Node card**
  - Surface: `--bg-surface`, 1px `--border-wire`, radius per design tokens.
  - Eyebrow (mono, muted): `TRIGGER · GITHUB`, `ACTION · SENTRY`, `BRANCH`, `END`.
  - Title (display/body), optional subtitle (muted).
  - Left accent bar: service brand color when `service` set; kind fallback (branch → hold, end → go, else wire).
  - Status row: green “Passed” / red “Failed” using semantic tokens when present.
  - Selected: 2px high-contrast border (not purple); `aria-selected`.
- **Edges**
  - Neutral wire by default.
  - Labeled Yes → `--hold`; No → `--go`; failed path may use `--signal`.
  - Simple SVG connectors between card anchors (orthogonal or straight) — keep lightweight.
- **Interaction**
  - Click node → select (toggle or replace selection — **single selection**).
  - Selecting a node **opens Refactor** if closed, and sets the composer chip to that node’s `title`.
  - Click empty canvas → clear selection (chip removed); panel may stay open.
  - Keyboard: selected node focusable; Enter opens/focuses Refactor.

### 2. Refactor panel (on demand)

- Closed by default on editor mount.
- Header CTA **+ Refactor** (secondary or primary-sm — prefer secondary so Run stays the primary header action) toggles the panel open/closed.
- Panel header: “Refactor” + close control (and optional minimize = same as close for v1).
- Closing clears nothing critical; selection may remain on the canvas; chip remains if selection remains.
- Empty / intro copy (aligned with screenshot, design.md voice):  
  “Describe a change to this step and I’ll draft a diff you can apply or discard.”
- Suggestion chips (optional v1, recommended for deploy-check): 2–3 static prompts; clicking fills the composer (preserving the step chip).

### 3. Step chip in composer

- When `selectedNode` is set, show a removable chip before/above the text input: `@ {title}` (or `Query errors (last 24h)` with @ prefix as in screenshot).
- Chip chrome: elevated bg, wire border, mono/small text — high contrast, not purple.
- Dismiss (×) clears selection and removes chip; does not necessarily close the panel.
- On send, prefix or attach context: e.g. instruction becomes `[@{title}] {user text}` for the stub (visible in the user bubble).

### 4. Editor chrome updates

- Add **+ Refactor** to the non-draft header action group (right side).
- Draft (“first look”) header may omit Refactor or include it — **include** so behavior is consistent.
- Existing tests that assume Refactor always visible must be updated: assert CTA present; open panel before querying composer.

## Architecture

```
WorkflowEditor
  state: refactorOpen, selectedNodeId
  + Refactor CTA → setRefactorOpen(true/false)
  FlowCanvas
    props: graph, selectedNodeId, onSelect(nodeId | null)
    → onSelect also setRefactorOpen(true)
  RefactorChat
    props: onApply, selectedStepTitle?, onClearStep?, onClose?
    → renders StepChip + composer
```

Keep `workflow.mermaid` updated on apply (existing); optionally ignore mermaid for Flow rendering once `flow` exists. If apply returns new mermaid only, v1 may leave `flow` unchanged (document as known limitation) **or** keep apply affecting code/mermaid only while Flow stays seed-static — prefer **seed-static flow for v1** so we don’t invent a mermaid→graph parser.

## Files (expected)

| Action | Path |
|--------|------|
| Create | `apps/desktop/renderer/src/types/flow.ts` (or extend `types/index.ts`) |
| Create | `apps/desktop/renderer/src/mock/flow-graphs.ts` (seed graphs) |
| Create | `apps/desktop/renderer/src/features/workflows/flow/FlowCanvas.tsx` |
| Create | `apps/desktop/renderer/src/features/workflows/flow/FlowNodeCard.tsx` |
| Create | `apps/desktop/renderer/src/features/workflows/flow/FlowEdges.tsx` (SVG) |
| Create | tests for canvas selection + chip |
| Modify | `Workflow` type + seed workflows to include `flow` |
| Modify | `SpecFlow.tsx` → host `FlowCanvas` (drop Mermaid from Flow tab) |
| Modify | `WorkflowEditor.tsx` → refactor open state, CTA, selection wiring |
| Modify | `RefactorChat.tsx` → close control, step chip, suggestions |
| Modify | `WorkflowEditor.test.tsx` (+ new panel tests) |

## Error Handling & Edge Cases

- Workflow with empty `flow.nodes`: show empty state “No flow steps yet” (should not happen for seeds).
- Unknown `service` on node: no logo; wire left accent.
- Refactor open on Code/Runs tabs: panel may remain available (same chrome); selection only applies on Flow. Switching away from Flow keeps chip until cleared.
- Rapid toggle of Refactor: no animation required beyond existing `--ease` transitions; respect `prefers-reduced-motion`.

## Testing

1. Editor mounts **without** Refactor composer visible; **+ Refactor** is present.
2. Clicking **+ Refactor** shows composer / panel.
3. Clicking a flow node selects it, opens Refactor if closed, and shows chip with node title.
4. Dismissing chip clears selection.
5. Closing panel hides Refactor; reopening restores composer (selection/chip if still selected).
6. Existing handoff / grid tests unaffected.
7. Manual: Deploy Check matches screenshot structure (GitHub → branch → Sentry → Slack / End) with go/hold edge colors.

## Acceptance Criteria

- [ ] Flow tab uses custom canvas (not Mermaid) with semantic edge colors and service accents.
- [ ] Refactor is closed by default; opens via **+ Refactor** CTA (and via node select).
- [ ] Selected component appears as a removable chip in the Refactor composer.
- [ ] Visual language follows `design.md` (no purple brand chrome).
- [ ] Unit tests cover open/close, selection → chip, chip dismiss.
- [ ] Seeded Deploy Check graph mirrors the reference screenshot’s step structure.

## Resolved Decisions

| Decision | Choice |
|----------|--------|
| Approach | A — custom React flow canvas |
| Color system | design.md semantics + ServiceLogo accents |
| Refactor default | Closed |
| Open triggers | + Refactor CTA; selecting a node |
| Flow data | Structured `FlowGraph` on workflow; Mermaid retained but not Flow SOR |
| Apply refactor → flow graph | v1 seed-static (mermaid/skill update only) |
