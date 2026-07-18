import type { ServiceName } from '../../../types';

const ACCENT: Partial<Record<ServiceName, string>> = {
  GitHub: 'currentColor', // wrapper sets text-heading
  Sentry: '#E1567C',
  Slack: '#E01E5A',
  Notion: 'currentColor',
  Linear: '#5E6AD2',
  Gmail: '#EA4335',
  Web: '#5f5f70',
};

export function serviceAccent(service?: ServiceName): string {
  if (!service) return 'var(--border-wire)';
  return ACCENT[service] ?? 'var(--border-wire)';
}
