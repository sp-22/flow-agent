import { render } from '@testing-library/react';
import { WorkflowIcon } from './WorkflowIcon';

test('applies a distinct color class per icon name', () => {
  const { container: rocket } = render(<WorkflowIcon name="rocket" />);
  expect(rocket.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-hold');

  const { container: clipboard } = render(<WorkflowIcon name="clipboard" />);
  expect(clipboard.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-[#4C8BF5]');

  const { container: money } = render(<WorkflowIcon name="money" />);
  expect(money.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-go');

  const { container: sparkles } = render(<WorkflowIcon name="sparkles" />);
  expect(sparkles.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-[#A78BFA]');
});
