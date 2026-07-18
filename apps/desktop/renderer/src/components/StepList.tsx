import type { RunStep } from '../types';
import { StepStatusIcon } from './StepStatusIcon';

const COLOR: Record<RunStep['status'], string> = {
  done: 'text-go',
  active: 'text-high',
  pending: 'text-muted',
};

export function StepList(props: { steps: RunStep[] }): JSX.Element {
  return (
    <ul className="flex flex-col gap-1">
      {props.steps.map((step, i) => (
        <li
          key={i}
          data-status={step.status}
          className="flex items-center gap-2 font-mono text-sm"
        >
          <span className={`flex items-center ${COLOR[step.status]}`}>
            <StepStatusIcon status={step.status} size={14} />
          </span>
          <span>{step.label}</span>
          {step.detail ? <span className="text-muted">{step.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}
