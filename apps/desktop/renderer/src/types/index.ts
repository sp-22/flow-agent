export type Health = 'go' | 'hold' | 'signal';

export type WorkflowIconName = 'rocket' | 'clipboard' | 'money' | 'sparkles';

export type ServiceName =
  | 'GitHub'
  | 'Sentry'
  | 'Slack'
  | 'Notion'
  | 'Linear'
  | 'Gmail'
  | 'Web';

export interface RunStep {
  label: string;
  status: 'done' | 'active' | 'pending';
  detail?: string;
}

export interface Run {
  id: string;
  workflowId: string;
  health: Health;
  steps: RunStep[];
  durationMs: number;
  at: string;
}

export interface Workflow {
  id: string;
  name: string;
  icon: WorkflowIconName;
  description: string;
  services: ServiceName[];
  health: Health;
  lastRunRelative: string;
  runSparkline: Array<'ok' | 'fail'>;
  skillPy: string;
  manifestYaml: string;
  mermaid: string;
  summary: string;
  draft: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  progress?: RunStep[];
}

export interface Task {
  id: string;
  title: string;
  createdRelative: string;
  messages: ChatMessage[];
}

export type AdapterId = 'claude' | 'codex';

export interface AdapterInfo {
  id: AdapterId;
  installed: boolean;
  authenticated: boolean;
  version: string | null;
}

export type AdapterEvent =
  | { type: 'detect'; adapters: AdapterInfo[] }
  | { type: 'status'; label: string }
  | { type: 'step'; label: string; status: 'done' | 'active' | 'pending' }
  | { type: 'output'; text: string }
  | { type: 'result'; ok: boolean; summary: string }
  | { type: 'error'; message: string; code: string };

export interface AdapterActionResult {
  ok: boolean;
  summary?: string;
  error?: string;
}

export interface AdapterBridge {
  detect(): Promise<AdapterInfo[]>;
  test(adapter: AdapterId): Promise<AdapterActionResult>;
  run(
    runId: string,
    args: { adapter: AdapterId; prompt: string; cwd?: string },
    onEvent: (event: AdapterEvent) => void
  ): Promise<AdapterActionResult>;
  cancel(runId: string): void;
}

declare global {
  interface Window {
    flowAgent?: { platform: string; adapter?: AdapterBridge };
  }
}
