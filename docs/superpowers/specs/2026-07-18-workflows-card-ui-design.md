# Workflows Card UI — Feature Spec

**Date:** 2026-07-18  
**Route:** `/#/workflows`  
**Status:** Approved for planning

## Summary

Update workflow cards on the Workflows page so each connected service is recognizable via brand logos inside service tags, the existing left workflow icons are colorized by type, and the primary card CTA reads **Execute** instead of **Run**.

## Goals

1. Make connected apps scannable at a glance on each card.
2. Keep the existing left iconography (rocket / clipboard / money / sparkles) but give each type a distinct color.
3. Rename the primary card action from **Run** to **Execute** without changing behavior.

## Non-Goals

- Voice Note icon / replacing waveform or sparkline representations.
- An “In Progress” workflow card (progress bar, percent complete, animated running state).
- Changing seed workflow content, execution behavior, or the Record overlay.
- Renaming **Run** elsewhere (Workflow Editor header, onboarding copy, etc.) unless it is the Workflows grid card CTA.

## Current State

- Cards are rendered by `WorkflowCard` inside `WorkflowGrid`.
- Each card shows:
  - Left `WorkflowIcon` (monochrome Lucide icon via `text-high`).
  - Text-only `ServiceTag` chips for `workflow.services`.
  - Sparkline of recent run outcomes.
  - Primary button labeled **Run** with a Play icon.
- Supported `ServiceName` values: `GitHub`, `Sentry`, `Slack`, `Notion`, `Linear`, `Gmail`, `Web`.
- Seeded workflows already list real services (e.g. Deploy Check → GitHub / Sentry / Slack).

## Design

### 1. Brand logos in ServiceTags

**Approach:** Inline SVG React components mapped by `ServiceName` (no new icon-library dependency).

**Component:** `ServiceLogo`

- Props: `name: ServiceName`, optional `size` (default ~12–14px).
- Renders a compact brand mark with official / recognizable brand coloring.
- Used only inside `ServiceTag` for this feature (other call sites may adopt later).

**`ServiceTag` update**

- Layout: `[ServiceLogo] [name]` with existing tag chrome (border, mono text, muted label).
- Gap between logo and label: tight (`gap-1` / 4px).
- Accessibility: logo is decorative (`aria-hidden`); the visible service name remains the accessible text.
- Fallback: if `name` is not a known `ServiceName`, render text-only (current behavior).

**Brand color treatment**

| Service | Treatment |
|---------|-----------|
| GitHub | Theme-aware mark (readable on light and dark surfaces) |
| Sentry | Official pink / purple brand color |
| Slack | Multi-color Slack mark |
| Notion | Theme-aware black/white mark |
| Linear | Official indigo (`#5E6AD2`) |
| Gmail | Multi-color Gmail mark |
| Web | Simple globe / web mark with a neutral accent (not a third-party brand) |

Theme note: the app’s token doc prefers minimal accent use. Brand logos and typed workflow-icon colors are an intentional exception for recognition on integration surfaces.

### 2. Colored WorkflowIcon

Keep the current Lucide mapping:

| Icon name | Glyph | Color intent |
|-----------|-------|--------------|
| `rocket` | Rocket | Amber / warm accent |
| `clipboard` | ClipboardList | Blue accent |
| `money` | CircleDollarSign | Green (`--go` or close) |
| `sparkles` | Sparkles | Hold / violet accent |

Implementation: a color map inside `WorkflowIcon` applied via `className` or `style`, so existing consumers (`WorkflowCard`, execution chips, prompt input) stay visually consistent without per-call-site changes.

Remove the card wrapper’s forced `text-high` override when it would wash out the icon color (apply color on the icon itself).

### 3. Primary CTA: Execute

On `WorkflowCard` only:

- Button label: **Execute**
- Keep `Play` icon and existing `onRun` callback / navigation to Executions
- Prop name `onRun` may remain (internal API); only user-visible copy changes

Update any tests that query the card button by name `/^Run$/i` (notably the handoff integration test) to match **Execute**.

## Architecture

```
WorkflowGrid
  └─ WorkflowCard
       ├─ WorkflowIcon (colored by icon name)
       ├─ ServiceTag[] → ServiceLogo + name
       ├─ Sparkline (unchanged)
       └─ Button "Execute" (behavior unchanged)
```

No store, route, or mock-data schema changes are required.

## Files

| Action | Path |
|--------|------|
| Create | `apps/desktop/renderer/src/components/ServiceLogo.tsx` |
| Create | `apps/desktop/renderer/src/components/ServiceLogo.test.tsx` (or ServiceTag tests covering logos) |
| Modify | `apps/desktop/renderer/src/components/ServiceTag.tsx` |
| Modify | `apps/desktop/renderer/src/components/WorkflowIcon.tsx` |
| Modify | `apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx` |
| Modify | Tests that assert card CTA label `Run` → `Execute` |

## Error Handling & Edge Cases

- Unknown service string: text-only tag, no crash.
- Missing logo map entry: treat as unknown (text-only).
- Dark/light theme: GitHub and Notion marks must remain legible on both `--bg-surface` and elevated card backgrounds.
- Long service lists: existing flex-wrap on the tag row remains; logos must not force overflow outside the card.

## Testing

1. `ServiceTag` / `ServiceLogo`: for each `ServiceName`, logo SVG (or role-appropriate mark) renders alongside the name.
2. `WorkflowCard`: primary button accessible name is **Execute**; Play icon still present.
3. Existing `WorkflowGrid` tests continue to pass.
4. Handoff test that clicks the card primary action updates to **Execute**.
5. Manual check at `/#/workflows`: Deploy Check, Onboard Client, and Price Monitor show correct brand marks; left icons are colored; CTA reads Execute.

## Acceptance Criteria

- [ ] Every service chip on workflow cards shows a brand-colored logo + name.
- [ ] Left workflow icons remain the same glyphs and are distinctly colored by type.
- [ ] Card primary CTA reads **Execute** and still opens/preloads Executions as today.
- [ ] No Voice Note / In Progress UI is introduced.
- [ ] Unit/integration tests covering the above pass.

## Open Decisions (resolved)

| Decision | Resolution |
|----------|------------|
| Logo placement | Inside `ServiceTag` (logo + name) |
| Left icon | Keep current icons; add per-type color |
| Logo style | Official brand-colored marks |
| Logo delivery | Inline SVG components (no new dependency) |
| Voice Note | Out of scope |
| In Progress card | Out of scope |
