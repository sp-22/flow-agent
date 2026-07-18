import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ThemeProvider } from '../store/theme.store';

test('renders brand and three tabs in lifecycle order', () => {
  render(
    <ThemeProvider>
      <MemoryRouter>
        <AppShell>
          <div />
        </AppShell>
      </MemoryRouter>
    </ThemeProvider>
  );
  const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
  expect(tabs).toEqual(['Record', 'Workflows', 'Executions']);
  expect(screen.getByText('WorkflowPilot')).toBeInTheDocument();
});
