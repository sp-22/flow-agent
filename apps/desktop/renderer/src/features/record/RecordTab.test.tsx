import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { RecordTab } from './RecordTab';

test('setup gates start on mic check, then enters recording', async () => {
  render(<WorkflowsProvider><MemoryRouter><RecordTab /></MemoryRouter></WorkflowsProvider>);
  // mic check auto-passes in mock after a tick; button becomes enabled
  const start = await screen.findByRole('button', { name: /Start Recording/i });
  expect(start).toBeEnabled();
  await userEvent.click(start);
  expect(screen.getByText(/Stop/i)).toBeInTheDocument();
});
