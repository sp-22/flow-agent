import { render } from '@testing-library/react';
import { ServiceLogo } from './ServiceLogo';
import type { ServiceName } from '../types';

const SERVICES: ServiceName[] = [
  'GitHub',
  'Sentry',
  'Slack',
  'Notion',
  'Linear',
  'Gmail',
  'Web',
];

test('renders an svg mark for every ServiceName', () => {
  for (const name of SERVICES) {
    const { container, unmount } = render(<ServiceLogo name={name} />);
    expect(container.querySelector('svg')).not.toBeNull();
    unmount();
  }
});
