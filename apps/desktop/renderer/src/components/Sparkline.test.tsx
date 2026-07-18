import { render } from '@testing-library/react';
import { Sparkline } from './Sparkline';

test('renders one bar per datum and marks fails', () => {
  const { container } = render(<Sparkline data={['ok', 'fail', 'ok']} />);
  const bars = container.querySelectorAll('i');
  expect(bars).toHaveLength(3);
  expect(bars[1].className).toContain('bg-signal');
});
