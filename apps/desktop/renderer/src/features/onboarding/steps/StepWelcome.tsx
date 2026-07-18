import * as React from 'react';
import { Video, Sparkles, Play, ArrowRight, type LucideIcon } from 'lucide-react';
import { Button } from '../../../components/Button';
import logo from '../../../assets/logo.png';

const FLOW: Array<{ Icon: LucideIcon; label: string }> = [
  { Icon: Video, label: 'Record' },
  { Icon: Sparkles, label: 'Generate' },
  { Icon: Play, label: 'Run' },
];

export interface StepWelcomeProps {
  onNext(): void;
}

export function StepWelcome({ onNext }: StepWelcomeProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <img
        src={logo}
        alt="WorkflowPilot Logo"
        className="h-12 w-12 shrink-0"
        style={{ filter: 'var(--logo-filter)' }}
      />
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
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-wire text-high">
                <step.Icon size={16} aria-hidden="true" />
              </span>
              <span className="text-xs text-muted">{step.label}</span>
            </div>
            {i < FLOW.length - 1 ? (
              <ArrowRight size={16} className="text-muted" aria-hidden="true" />
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <Button variant="primary" size="lg" onClick={onNext}>
        Get started
      </Button>
    </div>
  );
}
