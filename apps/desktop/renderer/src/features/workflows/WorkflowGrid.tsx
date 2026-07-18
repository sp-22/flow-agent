import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useWorkflows } from '../../store/workflows.store';
import { WorkflowCard } from './WorkflowCard';

export function WorkflowGrid(): JSX.Element {
  const { workflows } = useWorkflows();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workflows;
    return workflows.filter((w) => w.name.toLowerCase().includes(q));
  }, [workflows, query]);

  const goToRecord = () => navigate('/record');

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-medium text-heading">Workflows</h1>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-9 w-56 rounded-md border border-wire bg-surface px-3 text-sm text-body outline-none placeholder:text-muted focus-visible:border-wire-hover"
          />
          <Button variant="primary" size="md" onClick={goToRecord}>
            + Record
          </Button>
        </div>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          title="No workflows yet"
          actionLabel="Record your first workflow"
          onAction={goToRecord}
        />
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center font-mono text-sm text-muted">No workflows match “{query}”.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onOpen={() => navigate(`/workflows/${workflow.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
