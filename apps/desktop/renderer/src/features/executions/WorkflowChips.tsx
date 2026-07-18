import { useWorkflows } from '../../store/workflows.store';
import { WorkflowIcon } from '../../components/WorkflowIcon';

export interface WorkflowChipsProps {
  onPick(name: string): void;
}

export function WorkflowChips({ onPick }: WorkflowChipsProps): JSX.Element {
  const { workflows } = useWorkflows();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {workflows.map((workflow) => (
        <button
          key={workflow.id}
          type="button"
          onClick={() => onPick(workflow.name)}
          className="inline-flex items-center gap-1.5 rounded-full border border-wire bg-surface px-3 py-1.5 text-xs text-body transition-colors duration-150 ease-[var(--ease)] hover:border-wire-hover hover:text-heading"
        >
          <WorkflowIcon name={workflow.icon} size={14} />
          <span>{workflow.name}</span>
        </button>
      ))}
    </div>
  );
}
