import type { Run } from '../types';

export const SEED_RUNS: Run[] = [
  // Deploy Check
  {
    id: 'run-deploy-check-1',
    workflowId: 'deploy-check',
    health: 'go',
    steps: [
      { label: 'Fetch Latest GitHub Actions Run', status: 'done' },
      { label: 'Check Conclusion', status: 'done', detail: 'success' },
    ],
    durationMs: 1180,
    at: '2026-07-18T09:41:00.000Z',
  },
  {
    id: 'run-deploy-check-2',
    workflowId: 'deploy-check',
    health: 'go',
    steps: [
      { label: 'Fetch Latest GitHub Actions Run', status: 'done' },
      { label: 'Check Conclusion', status: 'done', detail: 'success' },
    ],
    durationMs: 1050,
    at: '2026-07-18T07:12:00.000Z',
  },
  {
    id: 'run-deploy-check-3',
    workflowId: 'deploy-check',
    health: 'hold',
    steps: [
      { label: 'Fetch Latest GitHub Actions Run', status: 'done' },
      { label: 'Check Conclusion', status: 'done', detail: 'no runs in 24h — stale' },
    ],
    durationMs: 640,
    at: '2026-07-17T22:03:00.000Z',
  },

  // Onboard Client
  {
    id: 'run-onboard-client-1',
    workflowId: 'onboard-client',
    health: 'go',
    steps: [
      { label: 'Query Notion for New Clients', status: 'done', detail: '1 found' },
      { label: 'Create Welcome Notion Page', status: 'done' },
      { label: 'Send Welcome Email via Gmail', status: 'done' },
    ],
    durationMs: 2420,
    at: '2026-07-18T05:58:00.000Z',
  },
  {
    id: 'run-onboard-client-2',
    workflowId: 'onboard-client',
    health: 'signal',
    steps: [
      { label: 'Query Notion for New Clients', status: 'done', detail: '1 found' },
      { label: 'Create Welcome Notion Page', status: 'done' },
      { label: 'Send Welcome Email via Gmail', status: 'pending', detail: 'SMTP auth failed' },
    ],
    durationMs: 1890,
    at: '2026-07-17T14:20:00.000Z',
  },
  {
    id: 'run-onboard-client-3',
    workflowId: 'onboard-client',
    health: 'go',
    steps: [
      { label: 'Query Notion for New Clients', status: 'done', detail: '0 found' },
      { label: 'Create Welcome Notion Page', status: 'done' },
      { label: 'Send Welcome Email via Gmail', status: 'done' },
    ],
    durationMs: 2210,
    at: '2026-07-16T11:03:00.000Z',
  },

  // Price Monitor
  {
    id: 'run-price-monitor-1',
    workflowId: 'price-monitor',
    health: 'signal',
    steps: [
      { label: 'Fetch Product Page (Web)', status: 'done' },
      { label: 'Parse Current Price', status: 'active', detail: 'no price match found — page structure changed' },
    ],
    durationMs: 780,
    at: '2026-07-18T09:05:00.000Z',
  },
  {
    id: 'run-price-monitor-2',
    workflowId: 'price-monitor',
    health: 'signal',
    steps: [
      { label: 'Fetch Product Page (Web)', status: 'done' },
      { label: 'Parse Current Price', status: 'active', detail: 'no price match found — page structure changed' },
    ],
    durationMs: 810,
    at: '2026-07-18T03:05:00.000Z',
  },
  {
    id: 'run-price-monitor-3',
    workflowId: 'price-monitor',
    health: 'go',
    steps: [
      { label: 'Fetch Product Page (Web)', status: 'done' },
      { label: 'Parse Current Price', status: 'done', detail: '$42.00' },
      { label: 'Send Alert Email (Gmail)', status: 'done', detail: 'skipped — above threshold' },
    ],
    durationMs: 950,
    at: '2026-07-17T21:05:00.000Z',
  },
];
