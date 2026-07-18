# Workflow View Flow Canvas & On-Demand Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Mermaid Flow tab with a selectable custom React flow canvas, open Refactor on demand via **+ Refactor**, and insert a removable @step chip when a node is selected.

**Architecture:** Seed each `Workflow` with a structured `FlowGraph` (nodes with explicit x/y + edges). `FlowCanvas` renders cards and SVG connectors. `WorkflowEditor` owns `refactorOpen` and `selectedNodeId`. `RefactorChat` gains close, step chip, and suggestion prompts. Mermaid stays on the model for Code/export but is not the Flow tab source of truth.

**Tech Stack:** React 18, TypeScript, Tailwind (`design.md` tokens), existing `ServiceLogo` / `Button` / `Badge`, Vitest + Testing Library. No new graph-layout library.

## Global Constraints

- Follow `design.md`: no purple brand chrome; selection = high-contrast / `border-hover`; Yes edges = `--hold`; No / Passed / End = `--go`; service left rails use brand accents from ServiceLogo.
- Refactor panel **closed by default**; opens via **+ Refactor** CTA and via selecting a flow node.
- Single node selection; chip shows `@ {title}`; dismiss clears selection.
- Flow graphs are **seed-static for v1** (apply refactor updates skillPy/mermaid only).
- CTA label is exactly `+ Refactor` (accessible name includes that text).
- Work from repo root: `c:\Users\Hemanshu Mistry\Desktop\Cursor Hack\flow-agent`
- Tests: `cd apps/desktop && npx vitest run <paths>` or `npm test`
- Spec: `docs/superpowers/specs/2026-07-18-workflow-view-flow-refactor-design.md`

## File Structure

| File | Responsibility |
|------|----------------|
| `apps/desktop/renderer/src/types/index.ts` | Add `FlowNodeKind`, `FlowNode`, `FlowEdge`, `FlowGraph`; `Workflow.flow` |
| `apps/desktop/renderer/src/mock/flow-graphs.ts` | Seed graphs for deploy-check, onboard-client, price-monitor |
| `apps/desktop/renderer/src/mock/workflows.ts` | Attach `flow` to each seed workflow |
| `apps/desktop/renderer/src/features/workflows/flow/serviceAccent.ts` | Service → accent CSS color map |
| `apps/desktop/renderer/src/features/workflows/flow/FlowNodeCard.tsx` | Selectable node card UI |
| `apps/desktop/renderer/src/features/workflows/flow/FlowEdges.tsx` | SVG edge layer |
| `apps/desktop/renderer/src/features/workflows/flow/FlowCanvas.tsx` | Grid canvas + nodes + edges + selection |
| `apps/desktop/renderer/src/features/workflows/panels/SpecFlow.tsx` | Host FlowCanvas instead of Mermaid |
| `apps/desktop/renderer/src/features/workflows/panels/RefactorChat.tsx` | Close, chip, suggestions |
| `apps/desktop/renderer/src/features/workflows/WorkflowEditor.tsx` | State, CTA, wiring |
| Tests | FlowCanvas, RefactorChat, WorkflowEditor |

---

### Task 1: Flow types + seed graphs on Workflows

**Files:**
- Modify: `apps/desktop/renderer/src/types/index.ts`
- Create: `apps/desktop/renderer/src/mock/flow-graphs.ts`
- Modify: `apps/desktop/renderer/src/mock/workflows.ts`
- Modify: `apps/desktop/renderer/src/mock/workflows.test.ts` (assert `flow.nodes.length > 0`)

**Interfaces:**
- Consumes: existing `ServiceName`, `Workflow`
- Produces: `FlowGraph` on every seeded workflow; `Workflow.flow: FlowGraph` required

- [ ] **Step 1: Write failing test**

In `apps/desktop/renderer/src/mock/workflows.test.ts`, add:

```ts
test('every seed workflow includes a non-empty flow graph', () => {
  for (const w of SEED_WORKFLOWS) {
    expect(w.flow.nodes.length).toBeGreaterThan(0);
    expect(w.flow.edges.length).toBeGreaterThan(0);
  }
});

test('deploy-check flow mirrors screenshot step titles', () => {
  const w = SEED_WORKFLOWS.find((x) => x.id === 'deploy-check')!;
  const titles = w.flow.nodes.map((n) => n.title);
  expect(titles).toEqual(
    expect.arrayContaining([
      'Fetch latest Actions run',
      'Deploy failed?',
      'Query errors (last 24h)',
      'Post summary',
      'Done',
    ])
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run renderer/src/mock/workflows.test.ts`

Expected: FAIL — `flow` missing on Workflow.

- [ ] **Step 3: Add types**

Append to `apps/desktop/renderer/src/types/index.ts` (before or after `Workflow`) and add `flow` to `Workflow`:

```ts
export type FlowNodeKind = 'trigger' | 'action' | 'branch' | 'end';

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  title: string;
  subtitle?: string;
  service?: ServiceName;
  status?: 'passed' | 'failed' | 'idle';
  durationLabel?: string;
  /** Canvas position in px (top-left of card). */
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  tone?: 'neutral' | 'go' | 'hold' | 'signal';
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

Update `Workflow`:

```ts
export interface Workflow {
  id: string;
  name: string;
  icon: WorkflowIconName;
  description: string;
  services: ServiceName[];
  health: Health;
  lastRunRelative: string;
  runSparkline: Array<'ok' | 'fail'>;
  skillPy: string;
  manifestYaml: string;
  mermaid: string;
  flow: FlowGraph;
  summary: string;
  draft: boolean;
}
```

- [ ] **Step 4: Create seed graphs**

Create `apps/desktop/renderer/src/mock/flow-graphs.ts`:

```ts
import type { FlowGraph } from '../types';

export const DEPLOY_CHECK_FLOW: FlowGraph = {
  nodes: [
    {
      id: 'dc-trigger',
      kind: 'trigger',
      title: 'Fetch latest Actions run',
      subtitle: 'Repo: acme/api · main',
      service: 'GitHub',
      status: 'passed',
      durationLabel: '0.3s',
      x: 24,
      y: 96,
    },
    {
      id: 'dc-branch',
      kind: 'branch',
      title: 'Deploy failed?',
      status: 'idle',
      x: 280,
      y: 108,
    },
    {
      id: 'dc-sentry',
      kind: 'action',
      title: 'Query errors (last 24h)',
      subtitle: 'Project: api-prod',
      service: 'Sentry',
      status: 'passed',
      durationLabel: '0.6s',
      x: 520,
      y: 40,
    },
    {
      id: 'dc-slack',
      kind: 'action',
      title: 'Post summary',
      subtitle: 'Channel: #incidents',
      service: 'Slack',
      status: 'passed',
      durationLabel: '0.3s',
      x: 780,
      y: 40,
    },
    {
      id: 'dc-end',
      kind: 'end',
      title: 'Done',
      subtitle: 'No action needed.',
      status: 'passed',
      x: 520,
      y: 220,
    },
  ],
  edges: [
    { id: 'e1', from: 'dc-trigger', to: 'dc-branch', tone: 'neutral' },
    { id: 'e2', from: 'dc-branch', to: 'dc-sentry', label: 'Yes', tone: 'hold' },
    { id: 'e3', from: 'dc-branch', to: 'dc-end', label: 'No', tone: 'go' },
    { id: 'e4', from: 'dc-sentry', to: 'dc-slack', tone: 'neutral' },
  ],
};

export const ONBOARD_CLIENT_FLOW: FlowGraph = {
  nodes: [
    {
      id: 'oc-notion',
      kind: 'trigger',
      title: 'Query Notion for new clients',
      subtitle: 'Status = New',
      service: 'Notion',
      status: 'passed',
      durationLabel: '0.4s',
      x: 24,
      y: 80,
    },
    {
      id: 'oc-branch',
      kind: 'branch',
      title: 'Any found?',
      x: 300,
      y: 96,
    },
    {
      id: 'oc-page',
      kind: 'action',
      title: 'Create welcome Notion page',
      service: 'Notion',
      status: 'passed',
      durationLabel: '0.8s',
      x: 540,
      y: 40,
    },
    {
      id: 'oc-gmail',
      kind: 'action',
      title: 'Send welcome email',
      service: 'Gmail',
      status: 'passed',
      durationLabel: '1.1s',
      x: 800,
      y: 40,
    },
    {
      id: 'oc-end',
      kind: 'end',
      title: 'Done',
      subtitle: 'No clients to onboard.',
      status: 'passed',
      x: 540,
      y: 220,
    },
  ],
  edges: [
    { id: 'oe1', from: 'oc-notion', to: 'oc-branch', tone: 'neutral' },
    { id: 'oe2', from: 'oc-branch', to: 'oc-page', label: 'Yes', tone: 'hold' },
    { id: 'oe3', from: 'oc-branch', to: 'oc-end', label: 'No', tone: 'go' },
    { id: 'oe4', from: 'oc-page', to: 'oc-gmail', tone: 'neutral' },
  ],
};

export const PRICE_MONITOR_FLOW: FlowGraph = {
  nodes: [
    {
      id: 'pm-web',
      kind: 'trigger',
      title: 'Fetch product page',
      service: 'Web',
      status: 'passed',
      durationLabel: '0.5s',
      x: 24,
      y: 100,
    },
    {
      id: 'pm-branch',
      kind: 'branch',
      title: 'Below threshold?',
      x: 300,
      y: 112,
    },
    {
      id: 'pm-gmail',
      kind: 'action',
      title: 'Send alert email',
      service: 'Gmail',
      status: 'failed',
      durationLabel: '0.2s',
      x: 560,
      y: 40,
    },
    {
      id: 'pm-end',
      kind: 'end',
      title: 'Done',
      subtitle: 'No alert needed.',
      status: 'passed',
      x: 560,
      y: 220,
    },
  ],
  edges: [
    { id: 'pe1', from: 'pm-web', to: 'pm-branch', tone: 'neutral' },
    { id: 'pe2', from: 'pm-branch', to: 'pm-gmail', label: 'Yes', tone: 'hold' },
    { id: 'pe3', from: 'pm-branch', to: 'pm-end', label: 'No', tone: 'go' },
  ],
};
```

- [ ] **Step 5: Attach flows in `workflows.ts`**

Import the three graphs and add `flow: DEPLOY_CHECK_FLOW` (etc.) to each object in `SEED_WORKFLOWS`.

- [ ] **Step 6: Run tests**

Run: `cd apps/desktop && npx vitest run renderer/src/mock/workflows.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/renderer/src/types/index.ts apps/desktop/renderer/src/mock/flow-graphs.ts apps/desktop/renderer/src/mock/workflows.ts apps/desktop/renderer/src/mock/workflows.test.ts
git commit -m "feat: add FlowGraph types and seed flow data"
```

---

### Task 2: FlowNodeCard + service accents

**Files:**
- Create: `apps/desktop/renderer/src/features/workflows/flow/serviceAccent.ts`
- Create: `apps/desktop/renderer/src/features/workflows/flow/FlowNodeCard.tsx`
- Create: `apps/desktop/renderer/src/features/workflows/flow/FlowNodeCard.test.tsx`

**Interfaces:**
- Consumes: `FlowNode`, `ServiceLogo`
- Produces:
  - `serviceAccent(service?: ServiceName): string` — CSS color
  - `FlowNodeCard({ node, selected, onSelect }): JSX.Element`

- [ ] **Step 1: Write failing test**

Create `FlowNodeCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowNodeCard } from './FlowNodeCard';
import type { FlowNode } from '../../../types';

const node: FlowNode = {
  id: 'n1',
  kind: 'action',
  title: 'Query errors (last 24h)',
  subtitle: 'Project: api-prod',
  service: 'Sentry',
  status: 'passed',
  durationLabel: '0.6s',
  x: 0,
  y: 0,
};

test('renders eyebrow, title, and passed status', () => {
  render(<FlowNodeCard node={node} selected={false} onSelect={() => {}} />);
  expect(screen.getByText(/ACTION/i)).toBeInTheDocument();
  expect(screen.getByText('Query errors (last 24h)')).toBeInTheDocument();
  expect(screen.getByText(/Passed/i)).toBeInTheDocument();
});

test('invokes onSelect when clicked', async () => {
  const onSelect = vi.fn();
  render(<FlowNodeCard node={node} selected={false} onSelect={onSelect} />);
  await userEvent.click(screen.getByRole('button', { name: /Query errors/i }));
  expect(onSelect).toHaveBeenCalledWith('n1');
});

test('marks selected state for a11y', () => {
  render(<FlowNodeCard node={node} selected onSelect={() => {}} />);
  expect(screen.getByRole('button', { name: /Query errors/i })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd apps/desktop && npx vitest run renderer/src/features/workflows/flow/FlowNodeCard.test.tsx`

- [ ] **Step 3: Implement serviceAccent + FlowNodeCard**

Create `serviceAccent.ts`:

```ts
import type { ServiceName } from '../../../types';

const ACCENT: Partial<Record<ServiceName, string>> = {
  GitHub: 'currentColor', // wrapper sets text-heading
  Sentry: '#E1567C',
  Slack: '#E01E5A',
  Notion: 'currentColor',
  Linear: '#5E6AD2',
  Gmail: '#EA4335',
  Web: '#5f5f70',
};

export function serviceAccent(service?: ServiceName): string {
  if (!service) return 'var(--border-wire)';
  return ACCENT[service] ?? 'var(--border-wire)';
}
```

Create `FlowNodeCard.tsx`:

```tsx
import { ServiceLogo } from '../../../components/ServiceLogo';
import type { FlowNode, FlowNodeKind } from '../../../types';
import { serviceAccent } from './serviceAccent';

export interface FlowNodeCardProps {
  node: FlowNode;
  selected: boolean;
  onSelect(id: string): void;
}

const KIND_LABEL: Record<FlowNodeKind, string> = {
  trigger: 'TRIGGER',
  action: 'ACTION',
  branch: 'BRANCH',
  end: 'END',
};

function kindAccent(node: FlowNode): string {
  if (node.service) return serviceAccent(node.service);
  if (node.kind === 'branch') return 'var(--hold)';
  if (node.kind === 'end') return 'var(--go)';
  return 'var(--border-wire)';
}

export function FlowNodeCard({ node, selected, onSelect }: FlowNodeCardProps): JSX.Element {
  const eyebrow = node.service
    ? `${KIND_LABEL[node.kind]} · ${node.service.toUpperCase()}`
    : KIND_LABEL[node.kind];

  return (
    <button
      type="button"
      role="button"
      aria-selected={selected}
      aria-label={node.title}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={[
        'absolute flex w-[220px] flex-col gap-1.5 rounded-lg border bg-surface p-3 text-left',
        'transition-colors duration-150 ease-[var(--ease)]',
        selected ? 'border-high border-2' : 'border-wire hover:border-wire-hover',
      ].join(' ')}
      style={{ left: node.x, top: node.y }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-sm text-heading"
        style={{ background: kindAccent(node) }}
      />
      <div className="flex items-center gap-1.5 pl-1.5">
        {node.service ? <ServiceLogo name={node.service} size={12} /> : null}
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{eyebrow}</span>
      </div>
      <p className="pl-1.5 font-display text-sm font-medium text-heading">{node.title}</p>
      {node.subtitle ? (
        <p className="pl-1.5 font-mono text-xs text-muted">{node.subtitle}</p>
      ) : null}
      {node.status && node.status !== 'idle' ? (
        <div className="flex items-center gap-1.5 pl-1.5 pt-0.5">
          <span
            className={[
              'font-mono text-xs',
              node.status === 'passed' ? 'text-go' : 'text-signal',
            ].join(' ')}
          >
            {node.status === 'passed' ? 'Passed' : 'Failed'}
          </span>
          {node.durationLabel ? (
            <span className="font-mono text-xs text-muted">{node.durationLabel}</span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/renderer/src/features/workflows/flow/serviceAccent.ts apps/desktop/renderer/src/features/workflows/flow/FlowNodeCard.tsx apps/desktop/renderer/src/features/workflows/flow/FlowNodeCard.test.tsx
git commit -m "feat: add FlowNodeCard with service accents"
```

---

### Task 3: FlowEdges + FlowCanvas + SpecFlow

**Files:**
- Create: `apps/desktop/renderer/src/features/workflows/flow/FlowEdges.tsx`
- Create: `apps/desktop/renderer/src/features/workflows/flow/FlowCanvas.tsx`
- Create: `apps/desktop/renderer/src/features/workflows/flow/FlowCanvas.test.tsx`
- Modify: `apps/desktop/renderer/src/features/workflows/panels/SpecFlow.tsx`

**Interfaces:**
- Consumes: `FlowGraph`, `FlowNodeCard`
- Produces:
  - `FlowCanvas({ graph, selectedNodeId, onSelect }): JSX.Element`
  - `SpecFlow({ graph, summary?, selectedNodeId, onSelect })` — **no Mermaid**

Card size constants for edge anchors: `CARD_W = 220`, `CARD_H ≈ 96` (use 88 for midpoint).

- [ ] **Step 1: Write failing FlowCanvas test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowCanvas } from './FlowCanvas';
import { DEPLOY_CHECK_FLOW } from '../../../mock/flow-graphs';

test('renders all deploy-check node titles', () => {
  render(
    <FlowCanvas graph={DEPLOY_CHECK_FLOW} selectedNodeId={null} onSelect={() => {}} />
  );
  expect(screen.getByText('Fetch latest Actions run')).toBeInTheDocument();
  expect(screen.getByText('Query errors (last 24h)')).toBeInTheDocument();
});

test('selecting a node calls onSelect with its id', async () => {
  const onSelect = vi.fn();
  render(
    <FlowCanvas graph={DEPLOY_CHECK_FLOW} selectedNodeId={null} onSelect={onSelect} />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Query errors (last 24h)' }));
  expect(onSelect).toHaveBeenCalledWith('dc-sentry');
});

test('clicking canvas background clears selection', async () => {
  const onSelect = vi.fn();
  render(
    <FlowCanvas
      graph={DEPLOY_CHECK_FLOW}
      selectedNodeId="dc-sentry"
      onSelect={onSelect}
    />
  );
  await userEvent.click(screen.getByTestId('flow-canvas'));
  expect(onSelect).toHaveBeenCalledWith(null);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement FlowEdges**

```tsx
import type { FlowEdge, FlowNode } from '../../../types';

const CARD_W = 220;
const CARD_H = 88;

const TONE_STROKE: Record<NonNullable<FlowEdge['tone']>, string> = {
  neutral: 'var(--border-hover)',
  go: 'var(--go)',
  hold: 'var(--hold)',
  signal: 'var(--signal)',
};

function centerRight(n: FlowNode): { x: number; y: number } {
  return { x: n.x + CARD_W, y: n.y + CARD_H / 2 };
}

function centerLeft(n: FlowNode): { x: number; y: number } {
  return { x: n.x, y: n.y + CARD_H / 2 };
}

export function FlowEdges(props: { nodes: FlowNode[]; edges: FlowEdge[] }): JSX.Element {
  const byId = new Map(props.nodes.map((n) => [n.id, n]));
  const width = Math.max(...props.nodes.map((n) => n.x + CARD_W + 40), 400);
  const height = Math.max(...props.nodes.map((n) => n.y + CARD_H + 40), 300);

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      aria-hidden="true"
    >
      {props.edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        const a = centerRight(from);
        const b = centerLeft(to);
        const midX = (a.x + b.x) / 2;
        const d = `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
        const stroke = TONE_STROKE[edge.tone ?? 'neutral'];
        return (
          <g key={edge.id}>
            <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} />
            {edge.label ? (
              <text
                x={midX}
                y={(a.y + b.y) / 2 - 6}
                textAnchor="middle"
                className="fill-muted"
                style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
                fill="currentColor"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 4: Implement FlowCanvas**

```tsx
import type { FlowGraph } from '../../../types';
import { FlowEdges } from './FlowEdges';
import { FlowNodeCard } from './FlowNodeCard';

export interface FlowCanvasProps {
  graph: FlowGraph;
  selectedNodeId: string | null;
  onSelect(id: string | null): void;
}

export function FlowCanvas({ graph, selectedNodeId, onSelect }: FlowCanvasProps): JSX.Element {
  if (graph.nodes.length === 0) {
    return <p className="py-12 text-center font-mono text-sm text-muted">No flow steps yet.</p>;
  }

  const width = Math.max(...graph.nodes.map((n) => n.x + 260), 400);
  const height = Math.max(...graph.nodes.map((n) => n.y + 140), 300);

  return (
    <div
      data-testid="flow-canvas"
      role="presentation"
      onClick={() => onSelect(null)}
      className="relative overflow-auto rounded-lg border border-wire bg-base"
      style={{
        minHeight: 320,
        backgroundImage:
          'radial-gradient(circle, var(--border-wire) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      <div className="relative" style={{ width, height }}>
        <FlowEdges nodes={graph.nodes} edges={graph.edges} />
        {graph.nodes.map((node) => (
          <FlowNodeCard
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update SpecFlow**

Replace `SpecFlow.tsx` with:

```tsx
import type { FlowGraph } from '../../../types';
import { FlowCanvas } from '../flow/FlowCanvas';

export interface SpecFlowProps {
  graph: FlowGraph;
  summary?: string;
  selectedNodeId: string | null;
  onSelect(id: string | null): void;
}

export function SpecFlow({
  graph,
  summary,
  selectedNodeId,
  onSelect,
}: SpecFlowProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {summary ? <p className="text-sm text-body">{summary}</p> : null}
      <FlowCanvas graph={graph} selectedNodeId={selectedNodeId} onSelect={onSelect} />
    </div>
  );
}
```

- [ ] **Step 6: Run FlowCanvas tests — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/renderer/src/features/workflows/flow apps/desktop/renderer/src/features/workflows/panels/SpecFlow.tsx
git commit -m "feat: custom FlowCanvas replaces Mermaid on Flow tab"
```

---

### Task 4: RefactorChat — close, step chip, suggestions

**Files:**
- Modify: `apps/desktop/renderer/src/features/workflows/panels/RefactorChat.tsx`
- Create: `apps/desktop/renderer/src/features/workflows/panels/RefactorChat.test.tsx`

**Interfaces:**
- Produces:

```ts
export interface RefactorChatProps {
  onApply(patch: DiffPatch): void;
  selectedStepTitle?: string | null;
  onClearStep?(): void;
  onClose?(): void;
  suggestions?: string[];
}
```

- Chip visible text: `@ {title}` (e.g. `@ Query errors (last 24h)`)
- Dismiss control `aria-label="Clear step"`
- Close control `aria-label="Close refactor"`
- Intro copy exactly: `Describe a change to this step and I'll draft a diff you can apply or discard.`
- On send with step: user message text is `[@{title}] {trimmed}` 

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefactorChat } from './RefactorChat';

vi.mock('../../../services/refactor.service', () => ({
  requestRefactor: vi.fn().mockResolvedValue({
    additions: ['+ x'],
    deletions: ['- y'],
    newSkillPy: 'print(1)',
    newMermaid: 'flowchart LR\n A-->B',
    explanation: 'ok',
  }),
}));

test('shows step chip when selectedStepTitle is set', () => {
  render(
    <RefactorChat
      onApply={() => {}}
      selectedStepTitle="Query errors (last 24h)"
      onClearStep={() => {}}
    />
  );
  expect(screen.getByText(/@\s*Query errors \(last 24h\)/)).toBeInTheDocument();
});

test('clear step calls onClearStep', async () => {
  const onClearStep = vi.fn();
  render(
    <RefactorChat
      onApply={() => {}}
      selectedStepTitle="Query errors (last 24h)"
      onClearStep={onClearStep}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Clear step' }));
  expect(onClearStep).toHaveBeenCalled();
});

test('close calls onClose', async () => {
  const onClose = vi.fn();
  render(<RefactorChat onApply={() => {}} onClose={onClose} />);
  await userEvent.click(screen.getByRole('button', { name: 'Close refactor' }));
  expect(onClose).toHaveBeenCalled();
});

test('suggestion fills the composer', async () => {
  render(
    <RefactorChat
      onApply={() => {}}
      suggestions={['Retry the Sentry query if it times out']}
    />
  );
  await userEvent.click(
    screen.getByRole('button', { name: /Retry the Sentry query if it times out/i })
  );
  expect(screen.getByPlaceholderText(/Describe a change/i)).toHaveValue(
    'Retry the Sentry query if it times out'
  );
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Rewrite RefactorChat**

Implement full component with:

- Header row: title “Refactor” + close (`X` from lucide) when `onClose` provided
- Seed agent message = intro copy from Interfaces above
- Optional suggestions list under “Try one of these”
- Composer area: chip row + input + Send
- Chip: `inline-flex items-center gap-1 rounded border border-wire bg-elevated px-2 py-0.5 font-mono text-xs text-heading` with `@ {title}` and × button
- Keep Apply/Discard pending-patch UI
- Prefix instruction on send when `selectedStepTitle` is set

Use placeholder: `Describe a change to this step…`

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/renderer/src/features/workflows/panels/RefactorChat.tsx apps/desktop/renderer/src/features/workflows/panels/RefactorChat.test.tsx
git commit -m "feat: RefactorChat step chip, close, and suggestions"
```

---

### Task 5: WorkflowEditor wiring + integration tests

**Files:**
- Modify: `apps/desktop/renderer/src/features/workflows/WorkflowEditor.tsx`
- Modify: `apps/desktop/renderer/src/features/workflows/WorkflowEditor.test.tsx`

**Interfaces / behavior:**
- State: `refactorOpen` default `false`; `selectedNodeId` default `null`
- Header includes `<Button variant="secondary">+ Refactor</Button>` that toggles `refactorOpen`
- Selecting a node: `setSelectedNodeId(id)`; if `id` non-null also `setRefactorOpen(true)`
- Clear step / canvas clear: `setSelectedNodeId(null)`
- Close panel: `setRefactorOpen(false)` (keep selection)
- SpecFlow receives `graph={workflow.flow}`, selection props
- Conditionally render panel: `{refactorOpen && ( <div className="w-[360px] shrink-0 border-l border-wire">…</div> )}`
- Suggestions for deploy-check (hardcode when `workflow.id === 'deploy-check'`, else omit or use generic 2 prompts):
  - `Also page on-call when a deploy fails`
  - `Retry the Sentry query if it times out`
  - `Only alert when there are 5+ new errors`
- `selectedStepTitle` = selected node’s title or null

- [ ] **Step 1: Update WorkflowEditor.test.tsx (RED)**

Replace the always-open assertion:

```tsx
import userEvent from '@testing-library/user-event';

test('refactor is closed by default and opens from CTA', async () => {
  renderAt('deploy-check');
  expect(screen.getByRole('button', { name: '+ Refactor' })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText(/Describe a change/i)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '+ Refactor' }));
  expect(screen.getByPlaceholderText(/Describe a change/i)).toBeInTheDocument();
});

test('selecting a flow node opens refactor with step chip', async () => {
  renderAt('deploy-check');
  await userEvent.click(screen.getByRole('button', { name: 'Query errors (last 24h)' }));
  expect(screen.getByPlaceholderText(/Describe a change/i)).toBeInTheDocument();
  expect(screen.getByText(/@\s*Query errors \(last 24h\)/)).toBeInTheDocument();
});

test('shows left spec tabs', () => {
  renderAt('deploy-check');
  expect(screen.getByRole('tab', { name: 'Flow' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Code' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Runs' })).toBeInTheDocument();
});
```

Keep the mermaid mock (harmless if unused).

- [ ] **Step 2: Run WorkflowEditor tests — expect FAIL** on closed-by-default / chip

- [ ] **Step 3: Wire WorkflowEditor**

Key edits (illustrative — merge into existing file carefully):

```tsx
const [refactorOpen, setRefactorOpen] = React.useState(false);
const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

const selectedStepTitle =
  selectedNodeId == null
    ? null
    : workflow.flow.nodes.find((n) => n.id === selectedNodeId)?.title ?? null;

const handleSelectNode = (id: string | null) => {
  setSelectedNodeId(id);
  if (id != null) setRefactorOpen(true);
};

const deploySuggestions =
  workflow.id === 'deploy-check'
    ? [
        'Also page on-call when a deploy fails',
        'Retry the Sentry query if it times out',
        'Only alert when there are 5+ new errors',
      ]
    : undefined;
```

Header actions (both draft and non-draft): include

```tsx
<Button
  variant="secondary"
  size="md"
  onClick={() => setRefactorOpen((v) => !v)}
>
  + Refactor
</Button>
```

Flow tab:

```tsx
{tab === 'Flow' ? (
  <SpecFlow
    graph={workflow.flow}
    summary={workflow.summary}
    selectedNodeId={selectedNodeId}
    onSelect={handleSelectNode}
  />
) : null}
```

Panel:

```tsx
{refactorOpen ? (
  <div className="w-[360px] shrink-0 border-l border-wire">
    <RefactorChat
      onApply={(patch) =>
        update(workflow.id, { skillPy: patch.newSkillPy, mermaid: patch.newMermaid })
      }
      selectedStepTitle={selectedStepTitle}
      onClearStep={() => setSelectedNodeId(null)}
      onClose={() => setRefactorOpen(false)}
      suggestions={deploySuggestions}
    />
  </div>
) : null}
```

Remove the always-mounted 360px panel.

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd apps/desktop && npx vitest run renderer/src/features/workflows/WorkflowEditor.test.tsx renderer/src/features/workflows/flow renderer/src/features/workflows/panels/RefactorChat.test.tsx renderer/src/mock/workflows.test.ts
```

Expected: PASS

- [ ] **Step 5: Full desktop suite**

Run: `cd apps/desktop && npm test`

Expected: all PASS (fix any `Workflow.flow` gaps in generation.service — draft spreads `SEED_WORKFLOWS[0]` so flow comes along).

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/renderer/src/features/workflows/WorkflowEditor.tsx apps/desktop/renderer/src/features/workflows/WorkflowEditor.test.tsx
git commit -m "feat: wire on-demand Refactor and flow node selection"
```

---

## Manual verification

1. Open `/#/workflows/deploy-check` — Flow canvas visible, no Refactor panel.
2. Click **+ Refactor** — panel opens; close via X.
3. Click Sentry node — panel opens with `@ Query errors (last 24h)` chip; Yes edge amber, No edge green.
4. Clear chip — selection clears; panel can stay open.
5. Light/dark theme — selection ring and go/hold edges remain legible.

---

## Self-Review (plan author)

1. **Spec coverage:** Custom canvas ✔ · on-demand Refactor ✔ · step chip ✔ · design.md colors ✔ · seed deploy-check structure ✔ · tests ✔  
2. **Placeholders:** None — full graphs, components, and editor wiring included  
3. **Type consistency:** `FlowGraph` / `selectedNodeId` / `selectedStepTitle` / `onSelect(id | null)` align across tasks  
