# Workflows Card UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add brand logos inside ServiceTags, colorize WorkflowIcons by type, and rename the Workflows card primary CTA from Run to Execute.

**Architecture:** Introduce a `ServiceLogo` map of inline brand SVGs keyed by `ServiceName`. `ServiceTag` composes logo + name. `WorkflowIcon` applies a per-icon color class. `WorkflowCard` drops the monochrome wrapper override and changes CTA copy only.

**Tech Stack:** React 18, TypeScript, Tailwind CSS utility classes, Lucide React (existing), Vitest + Testing Library.

## Global Constraints

- Scope is Workflows card UI only (`/#/workflows` cards) — no Voice Note icon, no In Progress card.
- Brand logos are official-colored inline SVGs — no new icon-library dependency.
- CTA user-visible copy on `WorkflowCard` is exactly `Execute` (Play icon stays); `onRun` prop name may remain.
- Keep existing `ServiceName` union: `GitHub` | `Sentry` | `Slack` | `Notion` | `Linear` | `Gmail` | `Web`.
- Unknown service names render text-only tags (no crash).
- GitHub and Notion marks must be theme-aware / legible on light and dark.
- Do not rename Run elsewhere (editor header, onboarding) in this plan.
- Work from repo root: `c:\Users\Hemanshu Mistry\Desktop\Cursor Hack\flow-agent`
- Tests run via: `npm test --workspace=@flow-agent/desktop` or `cd apps/desktop && npm test`
- Spec: `docs/superpowers/specs/2026-07-18-workflows-card-ui-design.md`

## File Structure

| File | Responsibility |
|------|----------------|
| `apps/desktop/renderer/src/components/ServiceLogo.tsx` | Inline brand SVG map for `ServiceName` |
| `apps/desktop/renderer/src/components/ServiceLogo.test.tsx` | Logo presence + unknown fallback |
| `apps/desktop/renderer/src/components/ServiceTag.tsx` | Compose logo + name in existing tag chrome |
| `apps/desktop/renderer/src/components/ServiceTag.test.tsx` | Tag shows logo + name |
| `apps/desktop/renderer/src/components/WorkflowIcon.tsx` | Per-icon color map |
| `apps/desktop/renderer/src/components/WorkflowIcon.test.tsx` | Color class applied per icon |
| `apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx` | Remove `text-high` washout; CTA `Execute` |
| `apps/desktop/renderer/src/features/integration/handoff.test.tsx` | Click `Execute` instead of `Run` |

---

### Task 1: ServiceLogo + ServiceTag brand marks

**Files:**
- Create: `apps/desktop/renderer/src/components/ServiceLogo.tsx`
- Create: `apps/desktop/renderer/src/components/ServiceLogo.test.tsx`
- Create: `apps/desktop/renderer/src/components/ServiceTag.test.tsx`
- Modify: `apps/desktop/renderer/src/components/ServiceTag.tsx`

**Interfaces:**
- Consumes: `ServiceName` from `apps/desktop/renderer/src/types/index.ts`
- Produces:
  - `ServiceLogo({ name: ServiceName; size?: number }): JSX.Element | null`
  - `ServiceTag({ name: string }): JSX.Element` — renders logo when `name` is a known `ServiceName`

- [ ] **Step 1: Write failing ServiceLogo + ServiceTag tests**

Create `apps/desktop/renderer/src/components/ServiceLogo.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { ServiceLogo } from './ServiceLogo';
import type { ServiceName } from '../types';

const SERVICES: ServiceName[] = [
  'GitHub',
  'Sentry',
  'Slack',
  'Notion',
  'Linear',
  'Gmail',
  'Web',
];

test('renders an svg mark for every ServiceName', () => {
  for (const name of SERVICES) {
    const { container, unmount } = render(<ServiceLogo name={name} />);
    expect(container.querySelector('svg')).not.toBeNull();
    unmount();
  }
});
```

Create `apps/desktop/renderer/src/components/ServiceTag.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { ServiceTag } from './ServiceTag';

test('shows brand logo and service name for a known service', () => {
  const { container } = render(<ServiceTag name="GitHub" />);
  expect(screen.getByText('GitHub')).toBeInTheDocument();
  expect(container.querySelector('svg')).not.toBeNull();
});

test('unknown service is text-only without logo', () => {
  const { container } = render(<ServiceTag name="UnknownApp" />);
  expect(screen.getByText('UnknownApp')).toBeInTheDocument();
  expect(container.querySelector('svg')).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/desktop && npx vitest run renderer/src/components/ServiceLogo.test.tsx renderer/src/components/ServiceTag.test.tsx`

Expected: FAIL — `ServiceLogo` module not found / logo svg missing.

- [ ] **Step 3: Implement ServiceLogo**

Create `apps/desktop/renderer/src/components/ServiceLogo.tsx` with this full content:

```tsx
import type { ServiceName } from '../types';

export interface ServiceLogoProps {
  name: ServiceName;
  size?: number;
}

function SvgShell({
  size,
  viewBox,
  children,
}: {
  size: number;
  viewBox: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

function GitHubMark({ size }: { size: number }): JSX.Element {
  return (
    <SvgShell size={size} viewBox="0 0 98 96">
      <path
        fill="currentColor"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      />
    </SvgShell>
  );
}

function SentryMark({ size }: { size: number }): JSX.Element {
  return (
    <SvgShell size={size} viewBox="0 0 40 40">
      <path
        fill="#E1567C"
        d="M20.5 4.5c-.6-1-1.7-1.6-2.9-1.6H10.2c-1.2 0-2.3.6-2.9 1.6L1.2 16.2c-.6 1-.6 2.3 0 3.3l6.1 11.7c.6 1 1.7 1.6 2.9 1.6h7.4c1.2 0 2.3-.6 2.9-1.6l3.8-7.2H17c-.7 0-1.3-.4-1.6-1L12 15.2c-.3-.6-.3-1.3 0-1.9l3.4-6.5c.3-.6.9-1 1.6-1h9.1l-5.6-1.3z"
      />
      <path
        fill="#362D59"
        d="M38.8 19.5l-6.1-11.7c-.6-1-1.7-1.6-2.9-1.6h-3.2l5.6 1.3c.7 0 1.3.4 1.6 1l3.4 6.5c.3.6.3 1.3 0 1.9L33.6 24c-.3.6-.9 1-1.6 1h-7.3l-3.8 7.2c.2.2.4.3.7.4.4.2.8.2 1.2.2h7.4c1.2 0 2.3-.6 2.9-1.6l6.1-11.7c.6-1 .6-2.3 0-3z"
      />
    </SvgShell>
  );
}

function SlackMark({ size }: { size: number }): JSX.Element {
  return (
    <SvgShell size={size} viewBox="0 0 24 24">
      <path fill="#E01E5A" d="M6.5 14.5a2 2 0 1 1-2-2h2v2z" />
      <path fill="#E01E5A" d="M7.5 14.5a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0v-5z" />
      <path fill="#36C5F0" d="M9.5 6.5a2 2 0 1 1 2-2v2h-2z" />
      <path fill="#36C5F0" d="M9.5 7.5a2 2 0 1 1 0 4h-5a2 2 0 1 1 0-4h5z" />
      <path fill="#2EB67D" d="M17.5 9.5a2 2 0 1 1 2 2h-2v-2z" />
      <path fill="#2EB67D" d="M16.5 9.5a2 2 0 1 1-4 0v-5a2 2 0 1 1 4 0v5z" />
      <path fill="#ECB22E" d="M14.5 17.5a2 2 0 1 1-2 2v-2h2z" />
      <path fill="#ECB22E" d="M14.5 16.5a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4h-5z" />
    </SvgShell>
  );
}

function NotionMark({ size }: { size: number }): JSX.Element {
  return (
    <SvgShell size={size} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M4.5 3.5h12.2c.5 0 1 .2 1.3.6l2.2 2.7c.2.3.3.6.3 1v11.7c0 .8-.7 1.5-1.5 1.5H6.8c-.5 0-1-.2-1.3-.6L3.5 17.8a1.7 1.7 0 0 1-.4-1.1V5c0-.8.7-1.5 1.4-1.5zm3 3.2v10.6h8.7V6.7H7.5zm2.1 1.6h2.1l2.4 3.5V8.3h1.5v7.2h-2l-2.5-3.6v3.6H9.6V8.3z"
      />
    </SvgShell>
  );
}

function LinearMark({ size }: { size: number }): JSX.Element {
  return (
    <SvgShell size={size} viewBox="0 0 24 24">
      <path
        fill="#5E6AD2"
        d="M2.5 12.2C2.5 7 6.7 2.8 12 2.8c1.3 0 2.5.3 3.6.7L3.2 15.8A9.1 9.1 0 0 1 2.5 12.2zm2.9 6.1 11.9-11.9c.9.9 1.6 2 2.1 3.2L7.6 19.4a9 9 0 0 1-2.2-1.1zm4.2 2.5 8.9-8.9c.2.8.3 1.6.3 2.4 0 5.2-4.2 9.4-9.4 9.4-.7 0-1.4-.1-2.1-.3l2.3-2.6z"
      />
    </SvgShell>
  );
}

function GmailMark({ size }: { size: number }): JSX.Element {
  return (
    <SvgShell size={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M2 6.5V18c0 .8.7 1.5 1.5 1.5H6V10.2l6 4.5 6-4.5V19.5h2.5c.8 0 1.5-.7 1.5-1.5V6.5L12 12.2 2 6.5z" />
      <path fill="#34A853" d="M18 19.5h2.5c.8 0 1.5-.7 1.5-1.5v-5.3l-4 3v3.8z" />
      <path fill="#FBBC04" d="M2 12.7V18c0 .8.7 1.5 1.5 1.5H6v-9.3l-4 2.5z" />
      <path fill="#EA4335" d="M22 6.5v1.4l-4 3V6.8l1.1-.8c.7-.5 1.7 0 1.7.9zM2 7.9V6.5c0-.9 1-1.4 1.7-.9L6 6.8v4.1L2 7.9z" />
      <path fill="#C5221F" d="M12 12.2 2 6.5l1.7-.9L12 10.2l8.3-4.6 1.7.9-10 5.7z" />
    </SvgShell>
  );
}

function WebMark({ size }: { size: number }): JSX.Element {
  return (
    <SvgShell size={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#5f5f70" strokeWidth="1.75" />
      <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="#5f5f70" strokeWidth="1.75" />
      <path d="M3.5 12h17M12 3.5c2.5 2.5 3.8 5.5 3.8 8.5S14.5 18 12 20.5C9.5 18 8.2 15 8.2 12S9.5 6 12 3.5z" fill="none" stroke="#5f5f70" strokeWidth="1.25" />
    </SvgShell>
  );
}

const LOGOS: Record<ServiceName, (props: { size: number }) => JSX.Element> = {
  GitHub: GitHubMark,
  Sentry: SentryMark,
  Slack: SlackMark,
  Notion: NotionMark,
  Linear: LinearMark,
  Gmail: GmailMark,
  Web: WebMark,
};

export function ServiceLogo({ name, size = 12 }: ServiceLogoProps): JSX.Element {
  const Mark = LOGOS[name];
  return (
    <span className="inline-flex text-heading">
      <Mark size={size} />
    </span>
  );
}

export function isServiceName(name: string): name is ServiceName {
  return Object.prototype.hasOwnProperty.call(LOGOS, name);
}
```

Note: add `import * as React from 'react';` at the top if the project’s JSX runtime requires it for `React.ReactNode` — prefer typing children as `JSX.Element | JSX.Element[]` or import `type { ReactNode } from 'react'` to match local style. Prefer:

```tsx
import type { ReactNode } from 'react';
```

and use `ReactNode` in `SvgShell`.

- [ ] **Step 4: Update ServiceTag**

Replace `apps/desktop/renderer/src/components/ServiceTag.tsx` with:

```tsx
import { ServiceLogo, isServiceName } from './ServiceLogo';

export interface ServiceTagProps {
  name: string;
}

export function ServiceTag({ name }: ServiceTagProps): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-wire px-1.5 py-0.5 font-mono text-xs leading-none text-muted">
      {isServiceName(name) ? <ServiceLogo name={name} size={12} /> : null}
      {name}
    </span>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/desktop && npx vitest run renderer/src/components/ServiceLogo.test.tsx renderer/src/components/ServiceTag.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/renderer/src/components/ServiceLogo.tsx apps/desktop/renderer/src/components/ServiceLogo.test.tsx apps/desktop/renderer/src/components/ServiceTag.tsx apps/desktop/renderer/src/components/ServiceTag.test.tsx
git commit -m "feat: add brand logos to ServiceTag chips"
```

---

### Task 2: Colorize WorkflowIcon by type

**Files:**
- Modify: `apps/desktop/renderer/src/components/WorkflowIcon.tsx`
- Create: `apps/desktop/renderer/src/components/WorkflowIcon.test.tsx`
- Modify: `apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx` (remove `text-high` wrapper only)

**Interfaces:**
- Consumes: `WorkflowIconName`
- Produces: `WorkflowIcon` applies these exact Tailwind text color classes:
  - `rocket` → `text-hold` (amber/warm via existing `--hold`)
  - `clipboard` → `text-[#4C8BF5]`
  - `money` → `text-go`
  - `sparkles` → `text-[#A78BFA]`

- [ ] **Step 1: Write failing WorkflowIcon test**

Create `apps/desktop/renderer/src/components/WorkflowIcon.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { WorkflowIcon } from './WorkflowIcon';

test('applies a distinct color class per icon name', () => {
  const { container: rocket } = render(<WorkflowIcon name="rocket" />);
  expect(rocket.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-hold');

  const { container: clipboard } = render(<WorkflowIcon name="clipboard" />);
  expect(clipboard.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-[#4C8BF5]');

  const { container: money } = render(<WorkflowIcon name="money" />);
  expect(money.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-go');

  const { container: sparkles } = render(<WorkflowIcon name="sparkles" />);
  expect(sparkles.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-[#A78BFA]');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run renderer/src/components/WorkflowIcon.test.tsx`

Expected: FAIL — class not present.

- [ ] **Step 3: Implement color map in WorkflowIcon**

Replace `apps/desktop/renderer/src/components/WorkflowIcon.tsx` with:

```tsx
import { Rocket, ClipboardList, CircleDollarSign, Sparkles, type LucideIcon } from 'lucide-react';
import type { WorkflowIconName } from '../types';

const ICONS: Record<WorkflowIconName, LucideIcon> = {
  rocket: Rocket,
  clipboard: ClipboardList,
  money: CircleDollarSign,
  sparkles: Sparkles,
};

const ICON_COLOR: Record<WorkflowIconName, string> = {
  rocket: 'text-hold',
  clipboard: 'text-[#4C8BF5]',
  money: 'text-go',
  sparkles: 'text-[#A78BFA]',
};

export interface WorkflowIconProps {
  name: WorkflowIconName;
  size?: number;
  className?: string;
}

export function WorkflowIcon({ name, size = 16, className }: WorkflowIconProps): JSX.Element {
  const Icon = ICONS[name] ?? Sparkles;
  const color = ICON_COLOR[name] ?? ICON_COLOR.sparkles;
  const merged = [color, className].filter(Boolean).join(' ');
  return <Icon size={size} className={merged} aria-hidden="true" />;
}
```

- [ ] **Step 4: Stop WorkflowCard from washing out the color**

In `apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx`, change the icon wrapper from:

```tsx
<span className="flex items-center leading-none text-high" aria-hidden="true">
  <WorkflowIcon name={workflow.icon} size={18} />
</span>
```

to:

```tsx
<span className="flex items-center leading-none" aria-hidden="true">
  <WorkflowIcon name={workflow.icon} size={18} />
</span>
```

Do **not** change the Run/Execute label in this task.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/desktop && npx vitest run renderer/src/components/WorkflowIcon.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/renderer/src/components/WorkflowIcon.tsx apps/desktop/renderer/src/components/WorkflowIcon.test.tsx apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx
git commit -m "feat: colorize WorkflowIcon by type"
```

---

### Task 3: Rename card CTA Run → Execute

**Files:**
- Modify: `apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx`
- Modify: `apps/desktop/renderer/src/features/integration/handoff.test.tsx`

**Interfaces:**
- Consumes: existing `onRun(): void`
- Produces: visible button name `Execute` (regex `/^Execute$/i` for tests)

- [ ] **Step 1: Update handoff test to expect Execute (RED if label still Run)**

In `apps/desktop/renderer/src/features/integration/handoff.test.tsx`:

1. Rename the test string to: `'Execute on a card pre-loads that workflow into the executions input'`
2. Change the click selector from `/^Run$/i` to `/^Execute$/i`

```tsx
test('Execute on a card pre-loads that workflow into the executions input', async () => {
  // ... same render setup ...
  await userEvent.click(screen.getAllByRole('button', { name: /^Execute$/i })[0]);
  // ... same assertions ...
});
```

- [ ] **Step 2: Run handoff test to verify it fails**

Run: `cd apps/desktop && npx vitest run renderer/src/features/integration/handoff.test.tsx`

Expected: FAIL — unable to find role button named `/^Execute$/i`.

- [ ] **Step 3: Change WorkflowCard CTA label**

In `apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx`, change:

```tsx
<Button variant="primary" size="sm" onClick={onRun}>
  <Play size={13} aria-hidden="true" />
  Run
</Button>
```

to:

```tsx
<Button variant="primary" size="sm" onClick={onRun}>
  <Play size={13} aria-hidden="true" />
  Execute
</Button>
```

Keep the Play icon and `onRun` prop.

- [ ] **Step 4: Run focused tests**

Run: `cd apps/desktop && npx vitest run renderer/src/features/integration/handoff.test.tsx renderer/src/features/workflows/WorkflowGrid.test.tsx renderer/src/components/ServiceTag.test.tsx renderer/src/components/WorkflowIcon.test.tsx`

Expected: PASS

- [ ] **Step 5: Run full desktop suite**

Run: `cd apps/desktop && npm test`

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/renderer/src/features/workflows/WorkflowCard.tsx apps/desktop/renderer/src/features/integration/handoff.test.tsx
git commit -m "feat: rename workflow card CTA to Execute"
```

---

## Self-Review Checklist (plan author)

1. **Spec coverage:** Logos in tags ✔ · Colored left icons ✔ · Execute CTA ✔ · Voice/In Progress excluded ✔  
2. **Placeholders:** None — full file contents and commands included  
3. **Type consistency:** `ServiceName`, `isServiceName`, `ServiceLogo`, color class strings match across tasks  
