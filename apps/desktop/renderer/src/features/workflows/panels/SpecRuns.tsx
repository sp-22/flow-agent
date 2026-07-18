import { useState } from 'react';
import { StatusDot } from '../../../components/StatusDot';
import { StepList } from '../../../components/StepList';
import type { Run } from '../../../types';

function humanizeWorkflowId(workflowId: string): string {
  return workflowId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function lastDetail(run: Run): string {
  for (let i = run.steps.length - 1; i >= 0; i -= 1) {
    const step = run.steps[i];
    if (step.detail) return step.detail;
  }
  return `${run.durationMs}ms`;
}

function formatTime(at: string): string {
  return new Date(at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SpecRuns(props: { runs: Run[] }): JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul className="flex flex-col divide-y divide-wire">
      {props.runs.map((run) => {
        const expanded = expandedId === run.id;
        return (
          <li key={run.id}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpandedId(expanded ? null : run.id)}
              className="flex w-full items-center gap-2 py-2 text-left hover:bg-elevated transition-colors duration-150 ease-[var(--ease)]"
            >
              <StatusDot tone={run.health} />
              <span className="text-sm text-body">{humanizeWorkflowId(run.workflowId)}</span>
              <span className="mono text-xs text-muted truncate">{lastDetail(run)}</span>
              <span className="ml-auto shrink-0 font-mono text-xs text-muted">
                {formatTime(run.at)}
              </span>
            </button>
            {expanded ? (
              <div className="pb-3 pl-5">
                <StepList steps={run.steps} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
