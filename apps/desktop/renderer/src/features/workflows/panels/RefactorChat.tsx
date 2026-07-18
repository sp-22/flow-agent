import * as React from 'react';
import { X, ArrowUp, Sparkles } from 'lucide-react';
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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const hasConversation = messages.some((m) => m.role === 'user');
  const showSuggestions = Boolean(suggestions && suggestions.length > 0) && !hasConversation;

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, pendingPatch]);

  const submit = () => {
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-wire px-4 py-3">
        <div className="flex flex-col">
          <h2 className="font-display text-sm font-medium text-heading">Refactor</h2>
          <p className="font-mono text-[11px] text-muted">Edit this workflow in plain language</p>
        </div>
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

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              'max-w-[85%] px-3.5 py-2 text-sm leading-relaxed',
              message.role === 'user'
                ? 'self-end rounded-2xl rounded-br-sm bg-elevated text-heading'
                : 'self-start rounded-2xl rounded-bl-sm border border-wire bg-surface text-body',
            ].join(' ')}
          >
            {message.text}
          </div>
        ))}

        {isLoading ? (
          <div className="self-start inline-flex items-center gap-1 rounded-2xl rounded-bl-sm border border-wire bg-surface px-3.5 py-3">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        ) : null}

        {showSuggestions ? (
          <div className="mt-1 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-muted">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-wide">Suggested edits</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {suggestions!.map((suggestion, i) => (
                <button
                  key={`suggestion-${i}`}
                  type="button"
                  onClick={() => setInstruction(suggestion)}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-wire bg-surface px-3 py-2 text-left text-sm text-body transition-colors hover:border-wire-hover hover:bg-elevated hover:text-heading"
                >
                  <span>{suggestion}</span>
                  <ArrowUp
                    className="h-3.5 w-3.5 shrink-0 rotate-45 text-muted transition-colors group-hover:text-body"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {pendingPatch ? (
          <div className="flex flex-col gap-2 self-stretch rounded-lg border border-wire bg-surface p-3">
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

      <form onSubmit={handleFormSubmit} className="border-t border-wire p-3">
        <div className="flex flex-col gap-2 rounded-xl border border-wire bg-surface p-2 transition-colors focus-within:border-wire-hover">
          {selectedStepTitle ? (
            <span className="inline-flex items-center gap-1 self-start rounded-md border border-wire bg-elevated px-2 py-0.5 font-mono text-xs text-heading">
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
          <div className="flex items-end gap-2">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER}
              disabled={isLoading}
              rows={1}
              className="max-h-32 min-h-[2rem] flex-1 resize-none bg-transparent px-1.5 py-1 text-sm text-body outline-none placeholder:text-muted disabled:opacity-40"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={isLoading || !instruction.trim()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-high text-base transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
