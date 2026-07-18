# Adapter Brand Tiles — Design Spec

**Date:** 2026-07-18  
**Status:** Approved visual direction

## Goal

Make the onboarding adapter choice feel like two distinct, recognizable products rather than plain settings rows.

## Design

Use two equal-width selectable tiles in a two-column grid:

- Claude Code and Codex each receive a larger monochrome official logo mark inside a restrained neutral logo well.
- The adapter name is the primary label; the provider/CLI command is secondary metadata.
- Readiness appears as compact semantic status text beneath the metadata.
- The selected tile uses the existing elevated background and stronger neutral border. Selection remains communicated through `aria-pressed`; no decorative brand colors are introduced.
- On narrow widths, tiles stack into one column to preserve readable labels and touch targets.

## Behavior

- Clicking anywhere on a tile selects it and clears the previous test error.
- Detection, testing, success, and actionable error behavior remain unchanged.
- The test button and error callout stay full-width beneath the tile grid.

## Assets

Store local SVG components/assets for the Claude and Codex marks. Render them with `currentColor` so dark and light themes use the existing monochrome text tokens.

## Testing

- Verify both tile names, logos, and statuses render.
- Verify selecting a tile changes `aria-pressed`.
- Keep existing onboarding success and adapter-error tests passing.
- Run renderer typecheck and production build.
