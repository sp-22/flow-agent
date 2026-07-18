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
  steps: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  progress?: RunStep[];
  /** True while the agent is actively running/streaming this turn. */
  pending?: boolean;
}

export interface Task {
  id: string;
  title: string;
  createdRelative: string;
  messages: ChatMessage[];
  workflowId?: string;
  pinned?: boolean;
}
