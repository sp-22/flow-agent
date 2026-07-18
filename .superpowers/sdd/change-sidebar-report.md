# GlobalSidebar restyle — Codex-style monochrome nav

## Scope
Single focused UI restyle of `apps/desktop/renderer/src/components/GlobalSidebar.tsx`. No other source file touched. Test file unchanged (queries still valid). All content, handlers, store usage (`useExecutions`/`useTheme`), `collapsed` prop behavior, `data-testid`/`data-collapsed`, and the collapsed icon-rail path preserved.

## What changed
- **Brand row**: kept logo + "Flow Agent" wordmark; added a decorative `ChevronDown` (14px, `text-muted`, no menu) next to the wordmark; added a `Search` icon button on the right, grouped with the collapse toggle inside a `no-drag` container. Drag region on the row preserved.
- **Primary/secondary nav rows**: replaced the two big filled `Button`s (New Execution, Create Workflow) with compact Codex-style nav rows — `flex items-center gap-2 rounded-md px-2 py-1.5 text-sm`, 16px icon + label.
  - "New Execution" reads as primary via `text-heading font-medium` + `SquarePen` icon (not a filled button). Same `handleNewExecution`, same accessible name "New Execution" (button text + `aria-label`).
  - "Workflows" stays a `NavLink` to `/workflows` with active state `bg-elevated text-heading`.
  - "Create Workflow" uses the `Mic` icon, `text-body hover:bg-elevated hover:text-heading`, still navigates `/record`.
- **Section labels**: "Pinned"/"Recent" restyled from mono-uppercase to `px-2 pt-4 pb-1 text-xs font-medium text-muted` (matches Codex's "Projects"). Words unchanged.
- **List rhythm**: scroll area padding tightened to `px-2`; groups use `gap-0.5` with `pt-4` label spacing for comfortable grouping.
- **Task rows**: unchanged structure (already compact `text-sm text-body hover:text-heading hover:bg-elevated rounded-md px-2 py-1.5`), retaining truncation, hover `MoreHorizontal` menu (pin/rename/delete), active highlight, and the pinned `Star` marker. Added `transition-colors` + `motion-reduce:transition-none`.
- **Bottom profile**: flush profile row kept — monochrome avatar circle (`bg-elevated border border-wire`, initial "G") + "Gaurav" + `ChevronRight`, with a subtle hover; theme toggle + proxy/claude `StatusDot`s remain in the compact row beneath. No colored badge.
- **Collapsed rail**: `w-14` icon-rail path preserved; nav items become 8x8 centered icon buttons, groups get `mt-2` spacing (since labels are hidden), same monochrome treatment.
- Removed now-unused `Button` import; added `ChevronDown`, `Search`, `SquarePen` from lucide.

## Mapping to reference while staying monochrome
The reference's structure is emulated: brand row with chevron + right-side search icon → tight primary nav list → muted section label → compact muted grouped rows with generous rhythm → flush bottom profile with circular avatar + name. Codex's blue/purple accents were intentionally NOT introduced: avatar, icons, and all chrome use only monochrome tokens (`bg-base/surface/elevated`, `border-wire(-hover)`, `text-muted/body/heading/high`). No gradients, glow shadows, or glassmorphism. Color remains reserved for semantic status (existing `StatusDot`/delete `text-signal`). Transitions respect `prefers-reduced-motion`.

## Test result
`npx vitest run src/components/GlobalSidebar.test.tsx` → **3 passed**. No lint errors. Test file did not need changes.

## Concerns
- The `Search` button and brand `ChevronDown` are decorative (no handler/menu), per the task ("no menu needed"). If wired later, add real behavior.
- Did not run full `tsc` (per constraints; a parallel subagent is editing elsewhere). Changes are TS-clean per lint, but no project-wide typecheck was performed.
