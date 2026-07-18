import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecCode } from './SpecCode';

test('switches between skill.py and manifest.yaml tabs', async () => {
  render(<SpecCode skillPy="print('hi')" manifestYaml="name: demo" />);
  expect(screen.getByText("print('hi')")).toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'manifest.yaml' }));
  expect(screen.getByText('name: demo')).toBeInTheDocument();
});
