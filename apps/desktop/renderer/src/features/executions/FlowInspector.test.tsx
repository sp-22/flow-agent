import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SEED_WORKFLOWS } from '../../mock/workflows';
import { FlowInspector } from './FlowInspector';

vi.mock('../../components/Mermaid', () => ({ Mermaid: () => null }));

const deployCheck = SEED_WORKFLOWS.find((w) => w.id === 'deploy-check')!;

test('renders the flow name', () => {
  render(<FlowInspector workflow={deployCheck} activeIndex={1} onClose={() => {}} />);
  expect(screen.getByText(deployCheck.name)).toBeInTheDocument();
});

test('drops the redundant step text list (steps live in the chat thread)', () => {
  render(<FlowInspector workflow={deployCheck} activeIndex={1} onClose={() => {}} />);
  expect(screen.queryAllByTestId('flow-step')).toHaveLength(0);
});

test('exposes a resize handle', () => {
  render(<FlowInspector workflow={deployCheck} activeIndex={1} onClose={() => {}} />);
  expect(
    screen.getByRole('separator', { name: /resize flow inspector/i })
  ).toBeInTheDocument();
});

test('close button invokes onClose', async () => {
  const onClose = vi.fn();
  render(<FlowInspector workflow={deployCheck} activeIndex={1} onClose={onClose} />);
  await userEvent.click(screen.getByLabelText('Close flow inspector'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
