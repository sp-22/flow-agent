import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the desktop scaffold', () => {
  render(<App />);

  expect(screen.getByText('Flow Agent')).toBeInTheDocument();
});

