# Task 3 Report — Execution Shell: FlowInspector, Thinking, New Home

Status: DONE

## Files changed

Created:
- `apps/desktop/renderer/src/features/executions/FlowInspector.tsx`
- `apps/desktop/renderer/src/features/executions/FlowInspector.test.tsx`

Modified:
- `apps/desktop/renderer/src/features/executions/ChatMessage.tsx`
- `apps/desktop/renderer/src/features/executions/NewTaskView.tsx`
- `apps/desktop/renderer/src/features/executions/Conversation.tsx`
- `apps/desktop/renderer/src/features/executions/ExecutionsTab.tsx`
- `apps/desktop/renderer/src/features/executions/NewTaskView.test.tsx`
- `apps/desktop/renderer/src/features/executions/Conversation.test.tsx`

Stayed strictly within the assigned file list; no shared/parallel-owned files touched.

## New props / exports

- `FlowInspector` (new export): `{ workflow: Workflow; activeIndex: number; onClose: () => void }`.
  - Right-side panel: `w-[380px] shrink-0`, `border-l border-wire bg-surface`, `overflow-y-auto`, full height.
  - Header: workflow name (`font-display text-heading`) + lucide `X` close button (`aria-label="Close flow inspector"`).
  - Body: `<Mermaid chart={workflow.mermaid} />` + ordered step list. Each row has `data-testid="flow-step"` and `data-status` (`done`/`active`/`pending`): `< activeIndex` done (`text-go`), `=== activeIndex` active (`text-high` + breathing `RecordingDot`), `> activeIndex` pending (`text-muted`). Uses `StepStatusIcon`.
- `ChatMessage` now exports `ChatMessageProps` and accepts optional `onOpenFlow?`, `flowName?`, `flowStepCount?` (plus existing `message`).
  - Animated "Thinking…" affordance when an agent message has a `progress` step with `status === 'active'`: a 6px `bg-signal` dot using the shared `breathe` 3s keyframe via `animate-[breathe_3s_ease-in-out_infinite] motion-reduce:animate-none` (respects `prefers-reduced-motion`).
  - When `onOpenFlow` is provided, renders a clickable `<button>` `▸ Flow: {flowName} ({flowStepCount} steps)` (`font-mono text-xs text-body hover:text-heading`) above the progress lines. Existing progress rendering untouched.
- `NewTaskView`: Gemini-style — heading "Build your workflows", `PromptInput` under it, "Your workflows" header row with a secondary **+ Create** button → `/record`, responsive `WorkflowCard` grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4`) wired `onOpen`→`/workflows/:id`, `onRun`→`preload(name)`+`/executions`. EmptyState fallback when no workflows.
- `Conversation`: hosts inspector. Local `flowOpen` state; resolves inspectable workflow via `activeWorkflowId` + `getById`. Last agent message with a `progress` array gets the flow-line props (only when a workflow resolves). `activeIndex = progress.filter(s => s.status === 'done').length`. Layout wraps conversation column (`flex-1 min-w-0`) and `FlowInspector` in `flex h-full`.
- `ExecutionsTab`: now renders only `<div className="h-full"><Conversation /></div>`; removed `TaskSidebar` (sidebar is global/shell-owned).

## Test command + result

`npx vitest run src/features/executions/` → PASS. 4 files, 7 tests passed (includes pre-existing `PromptInput.test.tsx`). Did not run full suite or `tsc`.

- `FlowInspector.test.tsx`: name + all 4 `deploy-check` labels render; `data-status` done/active/pending/pending for indices 0–3; close button calls `onClose`. Mermaid mocked via `vi.mock('../../components/Mermaid', () => ({ Mermaid: () => null }))`.
- `NewTaskView.test.tsx`: chat input (textbox), "Deploy Check" card, and a "Create" button all render.
- `Conversation.test.tsx`: existing streaming test kept; added test that the default workflow-linked task (task-1 → deploy-check) shows the clickable flow line and clicking it reveals the inspector.

## Concerns

- Conversation.test compromise: rather than manually constructing provider state, I relied on the existing seed default active task (`task-1`, linked to `deploy-check`) to exercise the flow-line → inspector path. Also added `vi.mock` for Mermaid in `Conversation.test.tsx` to keep jsdom output clean. Existing streaming assertion is unchanged and still passes.
- `prefers-reduced-motion`: implemented for the new Thinking dot via Tailwind `motion-reduce:animate-none`. The reused `RecordingDot` (active step in FlowInspector) still animates via inline style and is not gated by reduced-motion — this is pre-existing behavior of that shared component, left untouched.
