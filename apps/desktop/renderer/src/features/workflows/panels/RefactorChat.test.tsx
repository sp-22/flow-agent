import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefactorChat } from './RefactorChat';

vi.mock('../../../services/refactor.service', () => ({
  requestRefactor: vi.fn().mockResolvedValue({
    additions: ['+ x'],
    deletions: ['- y'],
    newSkillPy: 'print(1)',
    newMermaid: 'flowchart LR\n A-->B',
    explanation: 'ok',
  }),
}));

test('shows step chip when selectedStepTitle is set', () => {
  render(
    <RefactorChat
      onApply={() => {}}
      selectedStepTitle="Query errors (last 24h)"
      onClearStep={() => {}}
    />
  );
  expect(screen.getByText(/@\s*Query errors \(last 24h\)/)).toBeInTheDocument();
});

test('clear step calls onClearStep', async () => {
  const onClearStep = vi.fn();
  render(
    <RefactorChat
      onApply={() => {}}
      selectedStepTitle="Query errors (last 24h)"
      onClearStep={onClearStep}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Clear step' }));
  expect(onClearStep).toHaveBeenCalled();
});

test('close calls onClose', async () => {
  const onClose = vi.fn();
  render(<RefactorChat onApply={() => {}} onClose={onClose} />);
  await userEvent.click(screen.getByRole('button', { name: 'Close refactor' }));
  expect(onClose).toHaveBeenCalled();
});

test('suggestion fills the composer', async () => {
  render(
    <RefactorChat
      onApply={() => {}}
      suggestions={['Retry the Sentry query if it times out']}
    />
  );
  await userEvent.click(
    screen.getByRole('button', { name: /Retry the Sentry query if it times out/i })
  );
  expect(screen.getByPlaceholderText(/Describe a change/i)).toHaveValue(
    'Retry the Sentry query if it times out'
  );
});
