import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExecutions } from '../../store/executions.store';
import { useWorkflows } from '../../store/workflows.store';
import { EmptyState } from '../../components/EmptyState';
import { NewTaskView } from './NewTaskView';
import { ChatMessage } from './ChatMessage';
import { FlowInspector } from './FlowInspector';
import { PromptInput } from './PromptInput';

function buildFlowMermaid(steps: string[]): string {
  if (steps.length === 0) return 'flowchart TD';
  const nodes = steps.map((label, i) => `  s${i}["${label.replace(/"/g, "'")}"]`);
  const edges = steps.slice(1).map((_, i) => `  s${i} --> s${i + 1}`);
  return ['flowchart TD', ...nodes, ...edges].join('\n');
}

export function Conversation(): JSX.Element {
  const { active, activeWorkflowId, pendingPrompt, setPendingPrompt, send } = useExecutions();
  const { workflows, getById } = useWorkflows();
  const navigate = useNavigate();
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [flowOpen, setFlowOpen] = React.useState(false);

  const messages = active?.messages ?? [];

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const workflow = activeWorkflowId ? getById(activeWorkflowId) : undefined;

  const lastFlowMessageId = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i]!;
      if (message.role === 'agent' && message.progress) return message.id;
    }
    return undefined;
  }, [messages]);

  // Resolve the flow chart shown by the inspector. Prefer an explicitly
  // mentioned workflow; otherwise synthesise one from the run's progress steps
  // so free-text runs (e.g. "initiate deploy check") are still inspectable.
  const flow = React.useMemo(() => {
    if (workflow) {
      return { name: workflow.name, steps: workflow.steps, mermaid: workflow.mermaid };
    }
    const flowMessage = messages.find((m) => m.id === lastFlowMessageId);
    const progress = flowMessage?.progress;
    if (progress && progress.length > 0) {
      const steps = progress.map((step) => step.label);
      return { name: active?.title ?? 'Flow', steps, mermaid: buildFlowMermaid(steps) };
    }
    return undefined;
  }, [workflow, messages, lastFlowMessageId, active?.title]);

  if (!active || messages.length === 0) {
    if (workflows.length === 0) {
      return (
        <EmptyState
          title="No workflows yet — record one to run it here"
          actionLabel="Record your first workflow"
          onAction={() => navigate('/record')}
        />
      );
    }
    return <NewTaskView />;
  }

  const handleSubmit = () => {
    void send(pendingPrompt);
  };

  const lastFlowMessage = messages.find((m) => m.id === lastFlowMessageId);
  const activeIndex = lastFlowMessage?.progress
    ? lastFlowMessage.progress.filter((s) => s.status === 'done').length
    : 0;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((message) => {
              const showFlow = message.id === lastFlowMessageId && !!flow;
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onOpenFlow={showFlow ? () => setFlowOpen(true) : undefined}
                  flowName={showFlow ? flow?.name : undefined}
                  flowStepCount={showFlow ? flow?.steps.length : undefined}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="p-4">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            <PromptInput value={pendingPrompt} onChange={setPendingPrompt} onSubmit={handleSubmit} />
          </div>
        </div>
      </div>

      {flowOpen && flow ? (
        <FlowInspector
          name={flow.name}
          steps={flow.steps}
          mermaid={flow.mermaid}
          activeIndex={activeIndex}
          onClose={() => setFlowOpen(false)}
        />
      ) : null}
    </div>
  );
}
