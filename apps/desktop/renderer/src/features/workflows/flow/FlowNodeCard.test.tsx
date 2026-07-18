import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowNodeCard } from './FlowNodeCard';
import type { FlowNode } from '../../../types';

const node: FlowNode = {
  id: 'n1',
  kind: 'action',
  title: 'Query errors (last 24h)',
  subtitle: 'Project: api-prod',
  service: 'Sentry',
  status: 'passed',
  durationLabel: '0.6s',
  x: 0,
  y: 0,
};

test('renders eyebrow, title, and passed status', () => {
  render(<FlowNodeCard node={node} selected={false} onSelect={() => {}} />);
  expect(screen.getByText(/ACTION/i)).toBeInTheDocument();
  expect(screen.getByText('Query errors (last 24h)')).toBeInTheDocument();
  expect(screen.getByText(/Passed/i)).toBeInTheDocument();
});

test('invokes onSelect when clicked', async () => {
  const onSelect = vi.fn();
  render(<FlowNodeCard node={node} selected={false} onSelect={onSelect} />);
  await userEvent.click(screen.getByRole('button', { name: /Query errors/i }));
  expect(onSelect).toHaveBeenCalledWith('n1');
});

test('marks selected state for a11y', () => {
  render(<FlowNodeCard node={node} selected onSelect={() => {}} />);
  expect(screen.getByRole('button', { name: /Query errors/i })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});
