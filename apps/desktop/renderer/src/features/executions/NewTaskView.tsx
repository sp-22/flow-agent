import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExecutions } from '../../store/executions.store';
import { useWorkflows } from '../../store/workflows.store';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { WorkflowCard } from '../workflows/WorkflowCard';
import { PromptInput } from './PromptInput';

export function NewTaskView(): JSX.Element {
  const { pendingPrompt, setPendingPrompt, send, runWorkflow } = useExecutions();
  const { workflows } = useWorkflows();
  const navigate = useNavigate();

  const handleSubmit = () => {
    void send(pendingPrompt);
  };

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-8">
      <div className="mx-auto my-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-display text-2xl font-medium text-heading">Execute your workflow</h1>
          <p className="text-sm text-muted">
            Describe a task in plain English, or type “/” to run a specific workflow.
          </p>
        </div>

        <PromptInput value={pendingPrompt} onChange={setPendingPrompt} onSubmit={handleSubmit} />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-heading">Your workflows</h2>
            <Button variant="secondary" size="sm" onClick={() => navigate('/record')}>
              <Plus size={13} aria-hidden="true" />
              Create Workflow
            </Button>
          </div>

          {workflows.length === 0 ? (
            <EmptyState
              title="No workflows yet — record one to run it here"
              actionLabel="Record your first workflow"
              onAction={() => navigate('/record')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onOpen={() => {
                    void runWorkflow(workflow.name);
                  }}
                  onRun={() => {
                    void runWorkflow(workflow.name);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
