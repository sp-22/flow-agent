# Change Report — Vertically Center NewTaskView

## What changed
Edited only `apps/desktop/renderer/src/features/executions/NewTaskView.tsx`.

- Root container changed from `h-full overflow-y-auto p-8` to
  `flex h-full flex-col items-center overflow-y-auto p-8`.
- Inner `max-w-2xl` column: added `my-auto` and `w-full`
  (`mx-auto my-auto flex w-full max-w-2xl flex-col gap-8`).
- Hero block (heading + subline) now center-aligned:
  `flex flex-col items-center gap-2 text-center`.

No behavior/props changed. `PromptInput` (value/onChange/onSubmit → `send`),
Create button (`navigate('/record')`), `WorkflowCard` `onOpen`/`onRun`, and the
`EmptyState` branch are all untouched.

## Centering approach chosen
Parent is a flex column (`flex flex-col items-center`) with `overflow-y-auto`,
and the inner column uses `my-auto`. This centers short content vertically, and
when content is taller than the viewport the auto margins collapse to zero so the
content scrolls from the top without clipping the heading. Chosen over
`justify-center` on the parent, which would clip the top of tall content.

The hero heading + subline are `text-center`; the "Your workflows" section header
keeps its `justify-between` row (title left, Create button right) and the grid is
unchanged, all inside the shared `max-w-2xl` column so everything shares one
centered column / left edge. Added `w-full` so the max-width column fills up to
its cap consistently regardless of intrinsic content width.

## Test result
`npx vitest run src/features/executions/NewTaskView.test.tsx` → PASS (1/1).
No test edit was needed (selectors unchanged). No new lint errors.

## Concerns
- None significant. The `my-auto` + `overflow-y-auto` pattern is a well-known
  robust way to center-short / scroll-tall; verified conceptually, not visually
  rendered here.
