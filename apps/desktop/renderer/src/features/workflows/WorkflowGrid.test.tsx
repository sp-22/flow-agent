import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { WorkflowGrid } from './WorkflowGrid';

const setup = () => render(
  <WorkflowsProvider><MemoryRouter><WorkflowGrid /></MemoryRouter></WorkflowsProvider>
);

test('renders a card per seeded workflow', () => {
  setup();
  expect(screen.getByText('Deploy Check')).toBeInTheDocument();
  expect(screen.getByText('Price Monitor')).toBeInTheDocument();
});

test('search filters the grid', async () => {
  setup();
  await userEvent.type(screen.getByPlaceholderText('Search…'), 'Price');
  expect(screen.queryByText('Deploy Check')).not.toBeInTheDocument();
  expect(screen.getByText('Price Monitor')).toBeInTheDocument();
});
