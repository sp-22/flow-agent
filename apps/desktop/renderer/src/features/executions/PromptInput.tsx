import * as React from 'react';
import { useWorkflows } from '../../store/workflows.store';
import { Button } from '../../components/Button';
import { WorkflowIcon } from '../../components/WorkflowIcon';

export interface PromptInputProps {
  value: string;
  onChange(v: string): void;
  onSubmit(): void;
}

interface MentionState {
  open: boolean;
  start: number;
  query: string;
}

const CLOSED_MENTION: MentionState = { open: false, start: -1, query: '' };

function findMention(value: string, cursor: number): MentionState {
  const upTo = value.slice(0, cursor);
  const slashIndex = upTo.lastIndexOf('/');
  if (slashIndex === -1) return CLOSED_MENTION;

  const between = upTo.slice(slashIndex + 1);
  if (/\s/.test(between)) return CLOSED_MENTION;

  return { open: true, start: slashIndex, query: between };
}

export function PromptInput({ value, onChange, onSubmit }: PromptInputProps): JSX.Element {
  const { workflows } = useWorkflows();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [mention, setMention] = React.useState<MentionState>(CLOSED_MENTION);

  const matches = React.useMemo(() => {
    if (!mention.open) return [];
    const q = mention.query.toLowerCase();
    return workflows.filter((w) => w.name.toLowerCase().includes(q));
  }, [mention, workflows]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    const cursor = e.target.selectionStart ?? nextValue.length;
    setMention(findMention(nextValue, cursor));
    onChange(nextValue);
  };

  const pickMention = (name: string) => {
    const before = value.slice(0, mention.start);
    const after = value.slice(mention.start + 1 + mention.query.length);
    const nextValue = `${before}/${name} ${after}`;
    onChange(nextValue);
    setMention(CLOSED_MENTION);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && mention.open) {
      setMention(CLOSED_MENTION);
      return;
    }
    if (e.key === 'Enter') {
      if (mention.open && matches.length > 0) {
        e.preventDefault();
        pickMention(matches[0]!.name);
        return;
      }
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative w-full">
      {mention.open && matches.length > 0 && (
        <div
          role="listbox"
          className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-md border border-wire bg-elevated shadow-none"
        >
          {matches.map((w) => (
            <button
              key={w.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => pickMention(w.name)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface"
            >
              <WorkflowIcon name={w.icon} size={14} />
              <span>{w.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-wire bg-surface px-4 py-3 focus-within:border-wire-hover">
        <input
          ref={inputRef}
          type="text"
          role="textbox"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a task, or / to mention a workflow…"
          className="h-11 flex-1 bg-transparent text-base text-body outline-none placeholder:text-muted"
        />
        <Button variant="primary" size="sm" onClick={onSubmit}>
          Send
        </Button>
      </div>
    </div>
  );
}
