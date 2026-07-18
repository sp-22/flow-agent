import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('primary button uses high-contrast token classes', () => {
  render(<Button variant="primary">Run</Button>);
  const btn = screen.getByRole('button', { name: 'Run' });
  expect(btn.className).toContain('bg-high');
});
