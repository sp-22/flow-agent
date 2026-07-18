import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { ExecutionsProvider } from '../../store/executions.store';
import { Conversation } from './Conversation';

vi.mock('../../components/Mermaid', () => ({ Mermaid: () => null }));

function renderConversation() {
  render(
    <WorkflowsProvider>
      <ExecutionsProvider>
        <MemoryRouter>
          <Conversation />
        </MemoryRouter>
      </ExecutionsProvider>
    </WorkflowsProvider>
  );
}

test('sending a prompt appends a user message and streams an agent reply', async () => {
  renderConversation();
  await userEvent.type(screen.getByRole('textbox'), 'check staging');
  await userEvent.keyboard('{Enter}');
  expect(screen.getByText('check staging')).toBeInTheDocument();
  // execution.service's canned summaries do not literally contain "Done." — they
  // always end with `· re: "<prompt>"`, so we match on that guaranteed substring
  // instead (see report for details).
  expect(await screen.findByText(/re: "check staging"/i, {}, { timeout: 3000 })).toBeInTheDocument();
});

test('renders a clickable flow line that opens the inspector for a workflow-linked task', async () => {
  // The default active task (task-1) is linked to the deploy-check workflow.
  renderConversation();
  const flowLine = screen.getByRole('button', { name: /Flow: Deploy Check/i });
  expect(flowLine).toBeInTheDocument();
  await userEvent.click(flowLine);
  expect(screen.getByLabelText('Close flow inspector')).toBeInTheDocument();
  expect(screen.getByLabelText('Flow inspector')).toBeInTheDocument();
});
