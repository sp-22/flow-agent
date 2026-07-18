import * as React from 'react';
import { Button } from '../../../components/Button';

const FLOW = [
  { glyph: '●', label: 'Record' },
  { glyph: '⚙', label: 'Generate' },
  { glyph: '▶', label: 'Run' },
];

export interface StepWelcomeProps {
  onNext(): void;
}

export function StepWelcome({ onNext }: StepWelcomeProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="font-display text-xl text-heading">
        Turn any workflow into a script — just by doing it once.
      </h2>
      <p className="max-w-sm text-sm text-muted">
        WorkflowPilot watches you complete a task, turns it into a reliable automation, and
        runs it again on demand.
      </p>
      <div className="flex items-center gap-4">
        {FLOW.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-wire font-mono text-base text-high">
                {step.glyph}
              </span>
              <span className="text-xs text-muted">{step.label}</span>
            </div>
            {i < FLOW.length - 1 ? <span className="text-muted">→</span> : null}
          </React.Fragment>
        ))}
      </div>
      <Button variant="primary" size="lg" onClick={onNext}>
        Get started
      </Button>
    </div>
  );
}
