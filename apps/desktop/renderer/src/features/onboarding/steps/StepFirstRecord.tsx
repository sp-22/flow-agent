import { Button } from '../../../components/Button';

export interface StepFirstRecordProps {
  onDone(): void;
}

export function StepFirstRecord({ onDone }: StepFirstRecordProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="font-display text-xl text-heading">You're set up</h2>
      <p className="max-w-sm text-sm text-muted">
        Your API key and local proxy are ready. Record your first workflow and WorkflowPilot
        will turn it into a runnable automation.
      </p>
      <Button variant="primary" size="lg" onClick={onDone}>
        Record your first workflow
      </Button>
      <button
        type="button"
        onClick={onDone}
        className="text-xs text-muted underline underline-offset-2 hover:text-body"
      >
        I'll explore first
      </button>
    </div>
  );
}
