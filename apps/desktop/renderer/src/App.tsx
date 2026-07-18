import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './store/theme.store';
import { WorkflowsProvider } from './store/workflows.store';
import { OnboardingProvider, useOnboarding } from './store/onboarding.store';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { AppShell } from './components/AppShell';
import { WorkflowsTab } from './features/workflows/WorkflowsTab';

function Root(): JSX.Element {
  const { complete, finish } = useOnboarding();
  const navigate = useNavigate();

  if (!complete) {
    return (
      <OnboardingWizard
        onDone={(dest) => {
          finish();
          navigate(dest === 'record' ? '/record' : '/workflows');
        }}
      />
    );
  }

  return (
    <WorkflowsProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/workflows" replace />} />
          <Route path="/record" element={<div>Record</div>} />
          <Route path="/workflows" element={<WorkflowsTab />} />
          <Route path="/workflows/:id" element={<div>Workflow Detail</div>} />
          <Route path="/executions" element={<div>Executions</div>} />
        </Routes>
      </AppShell>
    </WorkflowsProvider>
  );
}

export default function App() {
  return (
    <div data-testid="app-root">
      <ThemeProvider>
        <OnboardingProvider>
          <BrowserRouter>
            <Root />
          </BrowserRouter>
        </OnboardingProvider>
      </ThemeProvider>
    </div>
  );
}
