import { Card } from '../../components/Card';
import { WorkflowIcon } from '../../components/WorkflowIcon';
import { ServiceTag } from '../../components/ServiceTag';
import type { Workflow } from '../../types';

export interface WorkflowCardProps {
  workflow: Workflow;
  onOpen(): void;
}

export function WorkflowCard({ workflow, onOpen }: WorkflowCardProps): JSX.Element {
  return (
    <Card
      onClick={onOpen}
      className="group relative flex cursor-pointer flex-col gap-3 p-4"
    >
      <div className="flex items-start gap-2">
        <span className="flex items-center leading-none text-high" aria-hidden="true">
          <WorkflowIcon name={workflow.icon} size={18} />
        </span>
        <h3 className="truncate font-display text-sm font-medium text-heading">{workflow.name}</h3>
      </div>

      <p className="line-clamp-2 text-sm text-muted">{workflow.description}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {workflow.services.map((service) => (
          <ServiceTag key={service} name={service} />
        ))}
      </div>
    </Card>
  );
}
