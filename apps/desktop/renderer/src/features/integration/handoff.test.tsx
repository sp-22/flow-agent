import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { ExecutionsProvider } from '../../store/executions.store';
import { WorkflowGrid } from '../workflows/WorkflowGrid';
import { ExecutionsTab } from '../executions/ExecutionsTab';

test('Execute on a card pre-loads that workflow into the executions input', async () => {
  render(
    <WorkflowsProvider><ExecutionsProvider>
      <MemoryRouter initialEntries={['/workflows']}>
        <Routes>
          <Route path="/workflows" element={<WorkflowGrid />} />
          <Route path="/executions" element={<ExecutionsTab />} />
        </Routes>
      </MemoryRouter>
    </ExecutionsProvider></WorkflowsProvider>
  );
  await userEvent.click(screen.getAllByRole('button', { name: /^Execute$/i })[0]);
  // preload() writes a `/Name ` mention into pendingPrompt, which Conversation's
  // PromptInput prefills from — confirmed via executions.store.tsx's preload().
  // NOTE: jest-dom's `toHaveValue` does not support asymmetric matchers
  // (expect.stringContaining) despite the brief's example — it compares the
  // literal string, so we read `.value` directly instead.
  const textbox = screen.getByRole('textbox') as HTMLInputElement;
  expect(textbox.value).toContain('/');
  expect(textbox.value).toBe('/Deploy Check ');
});
