import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { useWorkflows } from '../../store/workflows.store';
import { useExecutions, type ExecutionsContextValue } from '../../store/executions.store';
import { runTask } from '../../services/execution.service';
import { SEED_RUNS } from '../../mock/runs';
import type { Run, RunStep } from '../../types';
import { SpecFlow } from './panels/SpecFlow';
import { SpecCode } from './panels/SpecCode';
import { SpecRuns } from './panels/SpecRuns';
import { RefactorChat } from './panels/RefactorChat';

type TabName = 'Flow' | 'Code' | 'Runs';

const TABS: TabName[] = ['Flow', 'Code', 'Runs'];

// ExecutionsProvider isn't mounted in every host of this editor (e.g. the
// standalone WorkflowEditor unit test). Reading the hook defensively lets the
// Run hand-off degrade to a plain navigate instead of crashing the render.
function useOptionalExecutions(): ExecutionsContextValue | null {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useExecutions();
  } catch {
    return null;
  }
}

export function WorkflowEditor(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, save, update } = useWorkflows();
  const executions = useOptionalExecutions();
  const [tab, setTab] = React.useState<TabName>('Flow');
  const [runs, setRuns] = React.useState<Run[]>(() => SEED_RUNS.filter((r) => r.workflowId === id));
  const [refactorOpen, setRefactorOpen] = React.useState(false);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const workflow = id ? getById(id) : undefined;

  if (!workflow) {
    return (
      <div className="p-6">
        <p className="font-mono text-sm text-muted">Workflow not found.</p>
      </div>
    );
  }

  const selectedStepTitle =
    selectedNodeId == null
      ? null
      : workflow.flow.nodes.find((n) => n.id === selectedNodeId)?.title ?? null;

  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId != null) setRefactorOpen(true);
  };

  const deploySuggestions =
    workflow.id === 'deploy-check'
      ? [
          'Also page on-call when a deploy fails',
          'Retry the Sentry query if it times out',
          'Only alert when there are 5+ new errors',
        ]
      : undefined;

  const goToExecutions = () => {
    executions?.preload(workflow.name);
    navigate('/executions');
  };

  const runInline = (): void => {
    setTab('Runs');

    const runId = `run-inline-${Date.now()}`;
    const newRun: Run = {
      id: runId,
      workflowId: workflow.id,
      health: 'go',
      steps: [],
      durationMs: 0,
      at: new Date().toISOString(),
    };
    const startedAt = Date.now();
    setRuns((prev) => [newRun, ...prev]);

    void runTask(workflow.name, (step: RunStep) => {
      setRuns((prev) =>
        prev.map((r) => (r.id === runId ? { ...r, steps: [...r.steps, step] } : r))
      );
    }).then((summary) => {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === runId
            ? {
                ...r,
                health: 'go',
                durationMs: Date.now() - startedAt,
                steps: [...r.steps, { label: 'Summary', status: 'done', detail: summary }],
              }
            : r
        )
      );
    });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-wire p-4">
        {workflow.draft ? (
          <>
            <h1 className="font-display text-lg font-medium text-heading">
              {"Your workflow is ready — here's what I built"}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={() => setRefactorOpen((v) => !v)}>
                + Refactor
              </Button>
              <Button variant="primary" size="md" onClick={() => save(workflow.id)}>
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <input
                value={workflow.name}
                onChange={(e) => update(workflow.id, { name: e.target.value })}
                className="rounded-md border border-transparent bg-transparent px-1 font-display text-lg font-medium text-heading outline-none hover:border-wire focus-visible:border-wire-hover"
              />
              <Badge tone={workflow.health} dot>
                {workflow.health}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={() => setRefactorOpen((v) => !v)}>
                + Refactor
              </Button>
              <Button variant="secondary" size="md" onClick={goToExecutions}>
                Run in Console
              </Button>
              <Button variant="primary" size="md" onClick={runInline}>
                Run
              </Button>
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden border-r border-wire">
          <div role="tablist" className="flex gap-1 border-b border-wire px-4 pt-3">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={tab === name}
                className={[
                  'px-3 py-1.5 text-sm border-b transition-colors duration-150 ease-[var(--ease)]',
                  tab === name
                    ? 'text-high border-high'
                    : 'text-muted border-transparent hover:text-body',
                ].join(' ')}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'Flow' ? (
              <SpecFlow
                graph={workflow.flow}
                summary={workflow.summary}
                selectedNodeId={selectedNodeId}
                onSelect={handleSelectNode}
              />
            ) : null}
            {tab === 'Code' ? (
              <SpecCode skillPy={workflow.skillPy} manifestYaml={workflow.manifestYaml} />
            ) : null}
            {tab === 'Runs' ? <SpecRuns runs={runs} /> : null}
          </div>
        </div>

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
      </div>
    </div>
  );
}
