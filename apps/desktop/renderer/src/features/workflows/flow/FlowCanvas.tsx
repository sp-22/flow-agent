import type { FlowGraph } from '../../../types';
import { FlowEdges } from './FlowEdges';
import { FlowNodeCard } from './FlowNodeCard';

export interface FlowCanvasProps {
  graph: FlowGraph;
  selectedNodeId: string | null;
  onSelect(id: string | null): void;
}

export function FlowCanvas({ graph, selectedNodeId, onSelect }: FlowCanvasProps): JSX.Element {
  if (graph.nodes.length === 0) {
    return <p className="py-12 text-center font-mono text-sm text-muted">No flow steps yet.</p>;
  }

  const width = Math.max(...graph.nodes.map((n) => n.x + 260), 400);
  const height = Math.max(...graph.nodes.map((n) => n.y + 140), 300);

  return (
    <div
      data-testid="flow-canvas"
      role="presentation"
      onClick={() => onSelect(null)}
      className="relative overflow-auto rounded-lg border border-wire bg-base"
      style={{
        minHeight: 320,
        backgroundImage:
          'radial-gradient(circle, var(--border-wire) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      <div className="relative" style={{ width, height }}>
        <FlowEdges nodes={graph.nodes} edges={graph.edges} />
        {graph.nodes.map((node) => (
          <FlowNodeCard
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
