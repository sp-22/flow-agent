import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingProvider } from '../../store/onboarding.store';
import { OnboardingWizard } from './OnboardingWizard';

test('walks welcome → adapter → gates on selecting and testing an adapter', async () => {
  const onDone = vi.fn();
  render(
    <OnboardingProvider>
      <OnboardingWizard onDone={onDone} />
    </OnboardingProvider>
  );

  await userEvent.click(screen.getByRole('button', { name: /Get started/i }));

  // Adapter step: continue disabled until an adapter is selected and tested.
  const cont = screen.getByRole('button', { name: /Continue/i });
  expect(cont).toBeDisabled();

  // Detected adapters render as cards; pick Claude then test it.
  const claudeCard = await screen.findByTestId('adapter-card-claude');
  await userEvent.click(claudeCard);
  expect(claudeCard).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(screen.getByRole('button', { name: /Test adapter/i }));
  expect(await screen.findByText(/Connection verified/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
});
