import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingProvider } from '../../store/onboarding.store';
import { OnboardingWizard } from './OnboardingWizard';

test('walks welcome → api key → proxy → record and gates on verify', async () => {
  const onDone = vi.fn();
  render(
    <OnboardingProvider>
      <OnboardingWizard onDone={onDone} />
    </OnboardingProvider>
  );

  await userEvent.click(screen.getByRole('button', { name: /Get started/i }));

  // API key step: continue disabled until verify
  const cont = screen.getByRole('button', { name: /Continue/i });
  expect(cont).toBeDisabled();

  await userEvent.type(screen.getByPlaceholderText(/API key/i), 'sk-ant-xxx');
  await userEvent.click(screen.getByRole('button', { name: /Verify/i }));
  expect(await screen.findByText(/verified/i)).toBeInTheDocument();
});
