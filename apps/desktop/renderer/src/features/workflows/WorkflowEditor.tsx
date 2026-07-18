import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { useWorkflows } from '../../store/workflows.store';
import { SEED_RUNS } from '../../mock/runs';
import { SpecFlow } from './panels/SpecFlow';
import { SpecCode } from './panels/SpecCode';
import { SpecRuns } from './panels/SpecRuns';
import { RefactorChat } from './panels/RefactorChat';

type TabName = 'Flow' | 'Code' | 'Runs';

const TABS: TabName[] = ['Flow', 'Code', 'Runs'];

export function WorkflowEditor(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, save, update } = useWorkflows();
  const [tab, setTab] = React.useState<TabName>('Flow');

  const workflow = id ? getById(id) : undefined;

  if (!workflow) {
    return (
      <div className="p-6">
        <p className="font-mono text-sm text-muted">Workflow not found.</p>
      </div>
    );
  }

  const runs = SEED_RUNS.filter((run) => run.workflowId === workflow.id);
  const goToExecutions = () => navigate('/executions');

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-wire p-4">
        {workflow.draft ? (
          <>
            <h1 className="font-display text-lg font-medium text-heading">
              {"Your workflow is ready — here's what I built"}
            </h1>
            <Button variant="primary" size="md" onClick={() => save(workflow.id)}>
              Save
            </Button>
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
              <Button variant="secondary" size="md" onClick={goToExecutions}>
                Run in Console
              </Button>
              <Button variant="primary" size="md" onClick={goToExecutions}>
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
            {tab === 'Flow' ? <SpecFlow chart={workflow.mermaid} summary={workflow.summary} /> : null}
            {tab === 'Code' ? (
              <SpecCode skillPy={workflow.skillPy} manifestYaml={workflow.manifestYaml} />
            ) : null}
            {tab === 'Runs' ? <SpecRuns runs={runs} /> : null}
          </div>
        </div>

        <div className="w-[360px] shrink-0">
          <RefactorChat
            onApply={(patch) =>
              update(workflow.id, { skillPy: patch.newSkillPy, mermaid: patch.newMermaid })
            }
          />
        </div>
      </div>
    </div>
  );
}
