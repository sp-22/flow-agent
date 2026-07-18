import { Card } from '../../components/Card';
import { useExecutions } from '../../store/executions.store';
import { WorkflowChips } from './WorkflowChips';
import { PromptInput } from './PromptInput';

interface Suggestion {
  title: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  { title: 'Is the latest deploy healthy?', prompt: 'Is the latest deploy healthy?' },
  { title: 'Why did a workflow fail?', prompt: 'Why did my last run fail?' },
  { title: 'Onboard a new client', prompt: '/Onboard Client ' },
];

export function NewTaskView(): JSX.Element {
  const { pendingPrompt, setPendingPrompt, send } = useExecutions();

  const handleSubmit = () => {
    void send(pendingPrompt);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-2xl font-medium text-heading">What should I run for you?</h1>
        <p className="text-sm text-muted">
          Describe a task in plain English, or type “/” to run a specific workflow.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {SUGGESTIONS.map((suggestion) => (
          <Card
            key={suggestion.title}
            data-testid="suggestion-card"
            role="button"
            tabIndex={0}
            onClick={() => setPendingPrompt(suggestion.prompt)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPendingPrompt(suggestion.prompt);
            }}
            className="cursor-pointer p-4 text-left"
          >
            <p className="text-sm text-body">{suggestion.title}</p>
          </Card>
        ))}
      </div>

      <WorkflowChips onPick={(name) => setPendingPrompt(`/${name} `)} />

      <div className="w-full max-w-2xl">
        <PromptInput value={pendingPrompt} onChange={setPendingPrompt} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
