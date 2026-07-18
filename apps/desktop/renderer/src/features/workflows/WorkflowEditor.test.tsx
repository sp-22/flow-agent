import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WorkflowsProvider } from '../../store/workflows.store';
import { WorkflowEditor } from './WorkflowEditor';

// jsdom has no SVG layout engine (no getBBox), which the real mermaid render
// path relies on. Stub the module here (scoped to this test file only) so
// the split-pane editor can mount its Flow tab without an unhandled
// rejection from mermaid's internal renderer.
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
}));

const renderAt = (id: string) => render(
  <WorkflowsProvider>
    <MemoryRouter initialEntries={[`/workflows/${id}`]}>
      <Routes><Route path="/workflows/:id" element={<WorkflowEditor />} /></Routes>
    </MemoryRouter>
  </WorkflowsProvider>
);

test('shows left spec tabs and right refactor chat', () => {
  renderAt('deploy-check'); // seeded id
  expect(screen.getByRole('tab', { name: 'Flow' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Code' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Runs' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Ask for a change/i)).toBeInTheDocument();
});
