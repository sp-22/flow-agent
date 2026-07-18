import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowCanvas } from './FlowCanvas';
import { DEPLOY_CHECK_FLOW } from '../../../mock/flow-graphs';

test('renders all deploy-check node titles', () => {
  render(
    <FlowCanvas graph={DEPLOY_CHECK_FLOW} selectedNodeId={null} onSelect={() => {}} />
  );
  expect(screen.getByText('Fetch latest Actions run')).toBeInTheDocument();
  expect(screen.getByText('Query errors (last 24h)')).toBeInTheDocument();
});

test('selecting a node calls onSelect with its id', async () => {
  const onSelect = vi.fn();
  render(
    <FlowCanvas graph={DEPLOY_CHECK_FLOW} selectedNodeId={null} onSelect={onSelect} />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Query errors (last 24h)' }));
  expect(onSelect).toHaveBeenCalledWith('dc-sentry');
});

test('clicking canvas background clears selection', async () => {
  const onSelect = vi.fn();
  render(
    <FlowCanvas
      graph={DEPLOY_CHECK_FLOW}
      selectedNodeId="dc-sentry"
      onSelect={onSelect}
    />
  );
  await userEvent.click(screen.getByTestId('flow-canvas'));
  expect(onSelect).toHaveBeenCalledWith(null);
});
