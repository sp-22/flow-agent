import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { ExecutionsProvider, useExecutions } from '../../store/executions.store';
import { NewTaskView } from '../executions/NewTaskView';

vi.mock('../../components/Mermaid', () => ({ Mermaid: () => null }));

// Surfaces the active task so the test can observe the workflow handoff without
// depending on which execution view is currently mounted.
function ActiveProbe(): JSX.Element {
  const { active } = useExecutions();
  return (
    <div data-testid="active-run">
      {active ? `${active.title}::${active.messages[0]?.text ?? ''}` : 'none'}
    </div>
  );
}

test('clicking a workflow card on the welcome view starts that workflow run', async () => {
  render(
    <WorkflowsProvider>
      <ExecutionsProvider>
        <MemoryRouter>
          <NewTaskView />
          <ActiveProbe />
        </MemoryRouter>
      </ExecutionsProvider>
    </WorkflowsProvider>
  );

  // Cards are click-to-run on the welcome view; clicking the card body bubbles
  // to the card's onClick, which calls runWorkflow('Deploy Check').
  await userEvent.click(screen.getByRole('heading', { name: 'Deploy Check' }));

  await waitFor(() =>
    expect(screen.getByTestId('active-run')).toHaveTextContent('Deploy Check::/Deploy Check')
  );
});
