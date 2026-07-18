import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { ExecutionsProvider } from '../../store/executions.store';
import { NewTaskView } from './NewTaskView';

test('shows instruction prompt, suggestion cards, and chips', () => {
  render(<WorkflowsProvider><ExecutionsProvider><MemoryRouter><NewTaskView /></MemoryRouter></ExecutionsProvider></WorkflowsProvider>);
  expect(screen.getByText(/What should I run for you\?/i)).toBeInTheDocument();
  expect(screen.getAllByTestId('suggestion-card').length).toBeGreaterThanOrEqual(2);
});
