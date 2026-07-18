import type { FlowEdge, FlowNode } from '../../../types';

const CARD_W = 220;
const CARD_H = 88;

const TONE_STROKE: Record<NonNullable<FlowEdge['tone']>, string> = {
  neutral: 'var(--border-hover)',
  go: 'var(--go)',
  hold: 'var(--hold)',
  signal: 'var(--signal)',
};

function centerRight(n: FlowNode): { x: number; y: number } {
  return { x: n.x + CARD_W, y: n.y + CARD_H / 2 };
}

function centerLeft(n: FlowNode): { x: number; y: number } {
  return { x: n.x, y: n.y + CARD_H / 2 };
}

export function FlowEdges(props: { nodes: FlowNode[]; edges: FlowEdge[] }): JSX.Element {
  const byId = new Map(props.nodes.map((n) => [n.id, n]));
  const width = Math.max(...props.nodes.map((n) => n.x + CARD_W + 40), 400);
  const height = Math.max(...props.nodes.map((n) => n.y + CARD_H + 40), 300);

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      aria-hidden="true"
    >
      {props.edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        const a = centerRight(from);
        const b = centerLeft(to);
        const midX = (a.x + b.x) / 2;
        const d = `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
        const stroke = TONE_STROKE[edge.tone ?? 'neutral'];
        return (
          <g key={edge.id}>
            <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} />
            {edge.label ? (
              <text
                x={midX}
                y={(a.y + b.y) / 2 - 6}
                textAnchor="middle"
                className="fill-muted"
                style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
                fill="currentColor"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
