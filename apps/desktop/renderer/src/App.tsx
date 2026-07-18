import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './store/theme.store';
import { WorkflowsProvider } from './store/workflows.store';
import { ExecutionsProvider } from './store/executions.store';
import { OnboardingProvider, useOnboarding } from './store/onboarding.store';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { AppShell } from './components/AppShell';
import { WorkflowsTab } from './features/workflows/WorkflowsTab';
import { RecordTab } from './features/record/RecordTab';
import { ExecutionsTab } from './features/executions/ExecutionsTab';

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
      <ExecutionsProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/workflows" replace />} />
            <Route path="/record" element={<RecordTab />} />
            <Route path="/workflows/*" element={<WorkflowsTab />} />
            <Route path="/executions" element={<ExecutionsTab />} />
          </Routes>
        </AppShell>
      </ExecutionsProvider>
    </WorkflowsProvider>
  );
}

export default function App() {
  return (
    <div data-testid="app-root">
      <ThemeProvider>
        <OnboardingProvider>
          <HashRouter>
            <Root />
          </HashRouter>
        </OnboardingProvider>
      </ThemeProvider>
    </div>
  );
}
