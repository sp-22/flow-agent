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

export type FlowNodeKind = 'trigger' | 'action' | 'branch' | 'end';

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  title: string;
  subtitle?: string;
  service?: ServiceName;
  status?: 'passed' | 'failed' | 'idle';
  durationLabel?: string;
  /** Canvas position in px (top-left of card). */
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  tone?: 'neutral' | 'go' | 'hold' | 'signal';
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
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
  flow: FlowGraph;
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
