import { User, Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageModel, RunStep } from '../../types';
import { StepStatusIcon } from '../../components/StepStatusIcon';

function progressLineColor(step: RunStep): string {
  const haystack = `${step.label} ${step.detail ?? ''}`;
  if (/fail/i.test(haystack)) return 'text-signal';
  if (step.status === 'done') return 'text-go';
  if (step.status === 'active') return 'text-high';
  return 'text-muted';
}

export function ChatMessage(props: { message: ChatMessageModel }): JSX.Element {
  const { message } = props;
  const isUser = message.role === 'user';

  return (
    <div className="flex gap-3">
      <div
        aria-hidden="true"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-wire bg-elevated text-body"
      >
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>
      <div
        className={`max-w-[440px] rounded-md border border-wire px-4 py-3 text-sm leading-relaxed ${
          isUser ? 'bg-elevated text-heading' : 'bg-surface text-body'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {message.progress && message.progress.length > 0 ? (
          <div className="mt-2 flex flex-col gap-0.5 font-mono text-xs leading-relaxed">
            {message.progress.map((step, i) => (
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
        ) : null}
      </div>
    </div>
  );
}
