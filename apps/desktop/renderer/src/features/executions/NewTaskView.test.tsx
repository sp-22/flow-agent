import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { ExecutionsProvider } from '../../store/executions.store';
import { NewTaskView } from './NewTaskView';

function renderView() {
  render(
    <WorkflowsProvider>
      <ExecutionsProvider>
        <MemoryRouter>
          <NewTaskView />
        </MemoryRouter>
      </ExecutionsProvider>
    </WorkflowsProvider>
  );
}

test('renders the chat input, workflow cards, and a create affordance', () => {
  renderView();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(screen.getByText('Deploy Check')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
});
