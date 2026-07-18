import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './store/theme.store';
import { WorkflowsProvider } from './store/workflows.store';
import { AppShell } from './components/AppShell';
import { WorkflowsTab } from './features/workflows/WorkflowsTab';

export default function App() {
  return (
    <div data-testid="app-root">
      <ThemeProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/workflows" replace />} />
              <Route path="/record" element={<div>Record</div>} />
              <Route
                path="/workflows"
                element={
                  <WorkflowsProvider>
                    <WorkflowsTab />
                  </WorkflowsProvider>
                }
              />
              <Route path="/workflows/:id" element={<div>Workflow Detail</div>} />
              <Route path="/executions" element={<div>Executions</div>} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}
