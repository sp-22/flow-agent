import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlobalSidebar } from './GlobalSidebar';
import { ThemeProvider } from '../store/theme.store';
import { ExecutionsProvider } from '../store/executions.store';

function renderSidebar(collapsed = false): void {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <ExecutionsProvider>
          <GlobalSidebar collapsed={collapsed} onToggleCollapsed={() => {}} />
        </ExecutionsProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

test('renders brand, primary CTA, and workflows nav link', () => {
  renderSidebar();
  expect(screen.getByText('Flow Agent')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /new execution/i })).toBeInTheDocument();

  const workflowsLink = screen.getByRole('link', { name: /workflows/i });
  expect(workflowsLink.getAttribute('href')).toContain('workflows');
});

test('renders a recent (unpinned) task and a pinned task', () => {
  renderSidebar();
  // task-2 is unpinned in the seed → shows under Recent
  expect(screen.getByText('Is the staging server healthy?')).toBeInTheDocument();
  // task-1 "Deploy Check" is pinned in the seed → shows under Pinned
  expect(screen.getByText('Pinned')).toBeInTheDocument();
  expect(screen.getByText('Deploy Check')).toBeInTheDocument();
});

test('collapsed state hides the wordmark and marks the root', () => {
  renderSidebar(true);
  const root = screen.getByTestId('global-sidebar');
  expect(root.getAttribute('data-collapsed')).toBe('true');
  expect(screen.queryByText('Flow Agent')).not.toBeInTheDocument();
});
