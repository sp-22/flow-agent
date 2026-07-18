import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { ExecutionsProvider } from '../../store/executions.store';
import { Conversation } from './Conversation';

test('sending a prompt appends a user message and streams an agent reply', async () => {
  render(
    <WorkflowsProvider>
      <ExecutionsProvider>
        <MemoryRouter>
          <Conversation />
        </MemoryRouter>
      </ExecutionsProvider>
    </WorkflowsProvider>
  );
  await userEvent.type(screen.getByRole('textbox'), 'check staging');
  await userEvent.keyboard('{Enter}');
  expect(screen.getByText('check staging')).toBeInTheDocument();
  // execution.service's canned summaries do not literally contain "Done." — they
  // always end with `· re: "<prompt>"`, so we match on that guaranteed substring
  // instead (see report for details).
  expect(await screen.findByText(/re: "check staging"/i, {}, { timeout: 3000 })).toBeInTheDocument();
});
