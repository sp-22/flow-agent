import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

test('signal badge carries signal text token', () => {
  render(<Badge tone="signal" dot>Failed</Badge>);
  expect(screen.getByText('Failed').closest('span')!.className).toContain('text-signal');
});
