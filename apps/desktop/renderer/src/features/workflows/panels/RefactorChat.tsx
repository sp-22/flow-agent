import * as React from 'react';
import { Button } from '../../../components/Button';
import { requestRefactor, type DiffPatch } from '../../../services/refactor.service';

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

export function RefactorChat(props: { onApply(patch: DiffPatch): void }): JSX.Element {
  const [messages, setMessages] = React.useState<ChatEntry[]>([
    {
      id: nextId('seed'),
      role: 'agent',
      text: 'Ask for a change and I’ll propose a diff you can apply or discard.',
    },
  ]);
  const [instruction, setInstruction] = React.useState('');
  const [pendingPatch, setPendingPatch] = React.useState<DiffPatch | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = instruction.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { id: nextId('user'), role: 'user', text: trimmed }]);
    setInstruction('');
    setIsLoading(true);

    requestRefactor(trimmed).then((patch) => {
      setMessages((prev) => [...prev, { id: nextId('agent'), role: 'agent', text: patch.explanation }]);
      setPendingPatch(patch);
      setIsLoading(false);
    });
  };

  const handleApply = () => {
    if (!pendingPatch) return;
    props.onApply(pendingPatch);
    setMessages((prev) => [...prev, { id: nextId('agent'), role: 'agent', text: 'Applied the change.' }]);
    setPendingPatch(null);
  };

  const handleDiscard = () => {
    setMessages((prev) => [...prev, { id: nextId('agent'), role: 'agent', text: 'Discarded the proposed change.' }]);
    setPendingPatch(null);
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <h2 className="font-display text-sm font-medium text-heading">Refactor</h2>

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

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Ask for a change…"
          disabled={isLoading}
          className="h-9 flex-1 rounded-md border border-wire bg-surface px-3 text-sm text-body outline-none placeholder:text-muted focus-visible:border-wire-hover disabled:opacity-40"
        />
        <Button type="submit" variant="primary" size="md" disabled={isLoading || !instruction.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
