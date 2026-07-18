# Adapter Brand Tiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or direct TDD execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the onboarding adapter rows with responsive, logo-led Claude Code and Codex selection tiles.

**Architecture:** Keep adapter data and behavior inside `StepAdapter`. Add a focused `AdapterLogo` component containing local monochrome SVG marks rendered with `currentColor`, then compose it into a responsive two-column tile grid. No backend or store changes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, React Testing Library.

## Global Constraints

- Preserve existing detection, selection, testing, success, and error behavior.
- Logos must be monochrome and inherit the existing theme text color.
- Tiles use existing surface, border, text, and semantic status tokens.
- Two columns at normal wizard width; one column on narrow screens.
- Maintain `aria-pressed`, keyboard button behavior, and readable status text.

---

### Task 1: Build logo-led adapter tiles

**Files:**
- Create: `apps/desktop/renderer/src/features/onboarding/steps/AdapterLogo.tsx`
- Modify: `apps/desktop/renderer/src/features/onboarding/steps/StepAdapter.tsx`
- Modify: `apps/desktop/renderer/src/features/onboarding/steps/StepAdapter.test.tsx`

**Interfaces:**
- Produces: `AdapterLogo({ adapter, className? })` for `'claude' | 'codex'`.
- Preserves: current `StepAdapter` props, store calls, and test/error behavior.

- [ ] Add tests asserting each logo has an accessible adapter-specific label and the tiles retain `aria-pressed`.
- [ ] Implement local SVG logo marks using `currentColor`.
- [ ] Replace row markup with a responsive two-column tile grid.
- [ ] Keep status, selection, testing, and error states unchanged.
- [ ] Run focused tests, renderer typecheck, and production build.
