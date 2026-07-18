import type { ChatMessage as ChatMessageModel, RunStep } from '../../types';
import { StepStatusIcon } from '../../components/StepStatusIcon';

function progressLineColor(step: RunStep): string {
  const haystack = `${step.label} ${step.detail ?? ''}`;
  if (/fail/i.test(haystack)) return 'text-signal';
  if (step.status === 'done') return 'text-go';
  if (step.status === 'active') return 'text-high';
  return 'text-muted';
}

export interface ChatMessageProps {
  message: ChatMessageModel;
  onOpenFlow?: () => void;
  flowName?: string;
  flowStepCount?: number;
}

export function ChatMessage({ message, onOpenFlow, flowName, flowStepCount }: ChatMessageProps): JSX.Element {
  const isUser = message.role === 'user';

  // User turns sit on the right as a compact bubble; agent turns read as plain
  // left-aligned text (no avatar, no border) so the thread flows like a chat.
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-elevated px-4 py-2 text-sm leading-relaxed text-heading">
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    );
  }

  const isThinking = !!message.pending;
  const hasProgress = !!message.progress && message.progress.length > 0;

  const progressList =
    hasProgress ? (
      <div className="flex flex-col gap-0.5 font-mono text-xs leading-relaxed">
        {message.progress!.map((step, i) => (
          <div
            key={i}
            data-status={step.status}
            className={`flex items-center gap-1.5 ${progressLineColor(step)}`}
          >
            <StepStatusIcon status={step.status} size={12} className="shrink-0" />
            <span>
              {step.label}
              {step.detail ? ` — ${step.detail}` : ''}
            </span>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-2 pr-4 text-sm leading-relaxed text-body">
      <p className="whitespace-pre-wrap">{message.text}</p>

      {isThinking ? (
        <div className="flex items-center gap-1.5 text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-signal animate-[breathe_3s_ease-in-out_infinite] motion-reduce:animate-none"
          />
          <span className="text-xs">Thinking…</span>
        </div>
      ) : null}

      {onOpenFlow ? (
        <button
          type="button"
          onClick={onOpenFlow}
          className="block w-fit font-mono text-xs text-body transition-colors duration-150 ease-[var(--ease)] hover:text-heading"
        >
          ▸ Flow: {flowName} ({flowStepCount} steps)
        </button>
      ) : null}

      {hasProgress && onOpenFlow ? (
        <button
          type="button"
          onClick={onOpenFlow}
          title="Open flow chart"
          aria-label="Open flow chart"
          className="-mx-1 block w-fit rounded-md px-1 py-0.5 text-left transition-colors duration-150 ease-[var(--ease)] hover:bg-elevated"
        >
          {progressList}
        </button>
      ) : (
        progressList
      )}
    </div>
  );
}
