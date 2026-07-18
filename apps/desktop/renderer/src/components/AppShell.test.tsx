import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ThemeProvider } from '../store/theme.store';
import { ExecutionsProvider } from '../store/executions.store';

test('renders the Flow Agent brand and its children', () => {
  render(
    <ThemeProvider>
      <ExecutionsProvider>
        <MemoryRouter>
          <AppShell>
            <div>child-content</div>
          </AppShell>
        </MemoryRouter>
      </ExecutionsProvider>
    </ThemeProvider>
  );

  expect(screen.getByText('Flow Agent')).toBeInTheDocument();
  expect(screen.getByText('child-content')).toBeInTheDocument();
});
