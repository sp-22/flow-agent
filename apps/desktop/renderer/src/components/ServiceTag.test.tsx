import { render, screen } from '@testing-library/react';
import { ServiceTag } from './ServiceTag';

test('shows brand logo and service name for a known service', () => {
  const { container } = render(<ServiceTag name="GitHub" />);
  expect(screen.getByText('GitHub')).toBeInTheDocument();
  expect(container.querySelector('svg')).not.toBeNull();
});

test('unknown service is text-only without logo', () => {
  const { container } = render(<ServiceTag name="UnknownApp" />);
  expect(screen.getByText('UnknownApp')).toBeInTheDocument();
  expect(container.querySelector('svg')).toBeNull();
});
