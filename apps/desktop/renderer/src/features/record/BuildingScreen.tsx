import * as React from 'react';
import { buildSkill } from '../../services/generation.service';
import { StepList } from '../../components/StepList';
import type { RunStep, Workflow } from '../../types';

export interface BuildingScreenProps {
  onComplete(draft: Workflow): void;
}

export function BuildingScreen({ onComplete }: BuildingScreenProps): JSX.Element {
  const [steps, setSteps] = React.useState<RunStep[]>([]);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  React.useEffect(() => {
    let cancelled = false;

    buildSkill((step) => {
      if (cancelled) return;
      setSteps((prev) => [...prev, step]);
    }).then((draft) => {
      if (cancelled) return;
      onCompleteRef.current(draft);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-16">
      <h1 className="font-display text-xl text-heading">Building your automation</h1>
      <div className="min-w-[280px] rounded-md border border-wire bg-surface p-5">
        <StepList steps={steps} />
      </div>
    </div>
  );
}
