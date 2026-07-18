import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowsProvider } from '../../store/workflows.store';
import { PromptInput } from './PromptInput';

test('typing / opens the workflow mention dropdown', async () => {
  const noop = () => {};
  render(<WorkflowsProvider><PromptInput value="" onChange={noop} onSubmit={noop} /></WorkflowsProvider>);
  await userEvent.type(screen.getByRole('textbox'), '/');
  expect(await screen.findByText('Deploy Check')).toBeInTheDocument();
});
