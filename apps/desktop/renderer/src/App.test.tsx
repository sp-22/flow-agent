import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the migrated desktop app', () => {
  render(<App />);

  expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument();
  expect(screen.getByText('Get started')).toBeInTheDocument();
});
