import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { requestRefactor, type DiffPatch } from '../../../services/refactor.service';

const INTRO_COPY = "Describe a change to this step and I'll draft a diff you can apply or discard.";
const PLACEHOLDER = 'Describe a change to this step…';

export interface RefactorChatProps {
  onApply(patch: DiffPatch): void;
  selectedStepTitle?: string | null;
  onClearStep?(): void;
  onClose?(): void;
  suggestions?: string[];
}

interface ChatEntry {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

let entryCounter = 0;
function nextId(prefix: string): string {
  entryCounter += 1;
  return `${prefix}-${entryCounter}`;
}

export function RefactorChat(props: RefactorChatProps): JSX.Element {
  const { onApply, selectedStepTitle, onClearStep, onClose, suggestions } = props;
  const [messages, setMessages] = React.useState<ChatEntry[]>([
    { id: nextId('seed'), role: 'agent', text: INTRO_COPY },
  ]);
  const [instruction, setInstruction] = React.useState('');
  const [pendingPatch, setPendingPatch] = React.useState<DiffPatch | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = instruction.trim();
    if (!trimmed || isLoading) return;

    const userText = selectedStepTitle ? `[@${selectedStepTitle}] ${trimmed}` : trimmed;
    setMessages((prev) => [...prev, { id: nextId('user'), role: 'user', text: userText }]);
    setInstruction('');
    setIsLoading(true);

    requestRefactor(userText).then((patch) => {
      setMessages((prev) => [...prev, { id: nextId('agent'), role: 'agent', text: patch.explanation }]);
      setPendingPatch(patch);
      setIsLoading(false);
    });
  };

  const handleApply = () => {
    if (!pendingPatch) return;
    onApply(pendingPatch);
    setMessages((prev) => [...prev, { id: nextId('agent'), role: 'agent', text: 'Applied the change.' }]);
    setPendingPatch(null);
  };

  const handleDiscard = () => {
    setMessages((prev) => [...prev, { id: nextId('agent'), role: 'agent', text: 'Discarded the proposed change.' }]);
    setPendingPatch(null);
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium text-heading">Refactor</h2>
        {onClose ? (
          <button
            type="button"
            aria-label="Close refactor"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-body"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              'max-w-[90%] rounded-md px-3 py-2 text-sm',
              message.role === 'user'
                ? 'self-end bg-elevated text-body'
                : 'self-start bg-surface text-body',
            ].join(' ')}
          >
            {message.text}
          </div>
        ))}
        {isLoading ? <p className="font-mono text-xs text-muted">Thinking…</p> : null}

        {suggestions && suggestions.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-xs text-muted">Try one of these</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((suggestion, i) => (
                <button
                  key={`suggestion-${i}`}
                  type="button"
                  onClick={() => setInstruction(suggestion)}
                  className="self-start rounded-md border border-wire bg-surface px-3 py-1.5 text-left text-xs text-body transition-colors hover:border-wire-hover hover:text-heading"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {pendingPatch ? (
          <div className="flex flex-col gap-2 rounded-md border border-wire bg-surface p-3">
            <ul className="flex flex-col gap-1 font-mono text-xs">
              {pendingPatch.deletions.map((line, i) => (
                <li key={`del-${i}`} className="text-signal">
                  {line}
                </li>
              ))}
              {pendingPatch.additions.map((line, i) => (
                <li key={`add-${i}`} className="text-go">
                  {line}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleApply}>
                Apply
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDiscard}>
                Discard
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSend} className="flex flex-col gap-2">
        {selectedStepTitle ? (
          <span className="inline-flex items-center gap-1 self-start rounded border border-wire bg-elevated px-2 py-0.5 font-mono text-xs text-heading">
            @ {selectedStepTitle}
            {onClearStep ? (
              <button
                type="button"
                aria-label="Clear step"
                onClick={onClearStep}
                className="inline-flex items-center justify-center text-muted transition-colors hover:text-body"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </span>
        ) : null}
        <div className="flex gap-2">
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={PLACEHOLDER}
            disabled={isLoading}
            className="h-9 flex-1 rounded-md border border-wire bg-surface px-3 text-sm text-body outline-none placeholder:text-muted focus-visible:border-wire-hover disabled:opacity-40"
          />
          <Button type="submit" variant="primary" size="md" disabled={isLoading || !instruction.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
