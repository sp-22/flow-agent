import type { Task } from '../types';

export const SEED_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Deploy Check',
    createdRelative: 'Just now',
    messages: [
      {
        id: 'task-1-msg-1',
        role: 'user',
        text: '🚀 Deploy Check',
      },
      {
        id: 'task-1-msg-2',
        role: 'agent',
        text: 'Running Deploy Check…',
        progress: [
          { label: 'Fetch Latest GitHub Actions Run', status: 'done' },
          { label: 'Check Conclusion', status: 'active' },
        ],
      },
      {
        id: 'task-1-msg-3',
        role: 'agent',
        text: 'All clear — latest deploy on `main` succeeded in 1.2s. No Sentry cross-check needed.',
        progress: [
          { label: 'Fetch Latest GitHub Actions Run', status: 'done' },
          { label: 'Check Conclusion', status: 'done', detail: 'success' },
        ],
      },
    ],
  },
  {
    id: 'task-2',
    title: 'Is the staging server healthy?',
    createdRelative: '2 hours ago',
    messages: [
      {
        id: 'task-2-msg-1',
        role: 'user',
        text: 'Is the staging server healthy? If not, alert the Slack channel.',
      },
      {
        id: 'task-2-msg-2',
        role: 'agent',
        text: 'Checking staging health…',
        progress: [
          { label: 'Fetch Latest GitHub Actions Run', status: 'done' },
          { label: 'Query Sentry Errors (24h)', status: 'active' },
          { label: 'Format Summary', status: 'pending' },
          { label: 'Post to Slack #incidents', status: 'pending' },
        ],
      },
      {
        id: 'task-2-msg-3',
        role: 'agent',
        text: 'Staging deploy failed 18 minutes ago. Found 6 new Sentry issues in the last 24h. Posted a summary to #incidents.',
        progress: [
          { label: 'Fetch Latest GitHub Actions Run', status: 'done' },
          { label: 'Query Sentry Errors (24h)', status: 'done', detail: '6 issues' },
          { label: 'Format Summary', status: 'done' },
          { label: 'Post to Slack #incidents', status: 'done' },
        ],
      },
    ],
  },
  {
    id: 'task-3',
    title: 'Onboard Client — Acme Corp',
    createdRelative: 'Yesterday',
    messages: [
      {
        id: 'task-3-msg-1',
        role: 'user',
        text: '📋 Onboard Client',
      },
      {
        id: 'task-3-msg-2',
        role: 'agent',
        text: 'Scanning Notion for new clients…',
        progress: [
          { label: 'Query Notion for New Clients', status: 'done', detail: '1 found' },
          { label: 'Create Welcome Notion Page', status: 'active' },
          { label: 'Send Welcome Email via Gmail', status: 'pending' },
        ],
      },
      {
        id: 'task-3-msg-3',
        role: 'agent',
        text: 'Onboarded Acme Corp — created their welcome workspace in Notion and sent the welcome email to hello@acmecorp.com.',
        progress: [
          { label: 'Query Notion for New Clients', status: 'done', detail: '1 found' },
          { label: 'Create Welcome Notion Page', status: 'done' },
          { label: 'Send Welcome Email via Gmail', status: 'done' },
        ],
      },
      {
        id: 'task-3-msg-4',
        role: 'user',
        text: 'Thanks — can you also loop in their Slack channel next time?',
      },
      {
        id: 'task-3-msg-5',
        role: 'agent',
        text: 'Noted. I can add a "Post to Slack #clients" step to Onboard Client — want me to draft that change in the Refactor Chat for this workflow?',
      },
    ],
  },
  {
    id: 'task-4',
    title: 'Why did Price Monitor fail?',
    createdRelative: '3 days ago',
    messages: [
      {
        id: 'task-4-msg-1',
        role: 'user',
        text: 'Price Monitor has been flagging red all morning, what happened?',
      },
      {
        id: 'task-4-msg-2',
        role: 'agent',
        text: 'Inspecting the last two runs…',
        progress: [
          { label: 'Fetch Product Page (Web)', status: 'done' },
          { label: 'Parse Current Price', status: 'active' },
        ],
      },
      {
        id: 'task-4-msg-3',
        role: 'agent',
        text: 'The product page markup changed — the price regex no longer matches. This has failed twice in a row. Recommend updating the skill in the Refactor Chat.',
        progress: [
          { label: 'Fetch Product Page (Web)', status: 'done' },
          { label: 'Parse Current Price', status: 'done', detail: 'no match — page structure changed' },
        ],
      },
    ],
  },
];
