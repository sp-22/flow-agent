import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ title, actionLabel, onAction }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-display text-lg text-heading">{title}</p>
      <Button variant="primary" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
