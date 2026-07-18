import type { FlowGraph } from '../../../types';
import { FlowCanvas } from '../flow/FlowCanvas';

export interface SpecFlowProps {
  graph: FlowGraph;
  summary?: string;
  selectedNodeId: string | null;
  onSelect(id: string | null): void;
}

export function SpecFlow({
  graph,
  summary,
  selectedNodeId,
  onSelect,
}: SpecFlowProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {summary ? <p className="text-sm text-body">{summary}</p> : null}
      <FlowCanvas graph={graph} selectedNodeId={selectedNodeId} onSelect={onSelect} />
    </div>
  );
}
