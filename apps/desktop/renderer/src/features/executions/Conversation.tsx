import * as React from 'react';
import { useExecutions } from '../../store/executions.store';
import { NewTaskView } from './NewTaskView';
import { ChatMessage } from './ChatMessage';
import { WorkflowChips } from './WorkflowChips';
import { PromptInput } from './PromptInput';

export function Conversation(): JSX.Element {
  const { active, pendingPrompt, setPendingPrompt, send } = useExecutions();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const messages = active?.messages ?? [];

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  if (!active || messages.length === 0) {
    return <NewTaskView />;
  }

  const handleSubmit = () => {
    void send(pendingPrompt);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-wire p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <WorkflowChips onPick={(name) => setPendingPrompt(`/${name} `)} />
          <PromptInput value={pendingPrompt} onChange={setPendingPrompt} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
