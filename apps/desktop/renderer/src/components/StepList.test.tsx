import { render, screen } from '@testing-library/react';
import { StepList } from './StepList';

test('shows check for done and marks active step', () => {
  render(
    <StepList
      steps={[
        { label: 'Fetch', status: 'done' },
        { label: 'Post', status: 'active' },
      ]}
    />
  );
  expect(screen.getByText('Fetch')).toBeInTheDocument();
  expect(screen.getByText('Post').closest('[data-status]')!.getAttribute('data-status')).toBe(
    'active'
  );
});
