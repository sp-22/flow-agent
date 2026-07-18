import type { FlowEdge, FlowNode } from '../../../types';

const CARD_W = 220;
const CARD_H = 88;

const EDGE_STROKE = 'var(--border-hover)';

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
        const midY = (a.y + b.y) / 2;
        const d = `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
        const label = edge.label ? edge.label.toUpperCase() : null;
        const chipW = label ? label.length * 7.5 + 20 : 0;
        const chipH = 20;
        return (
          <g key={edge.id}>
            <path d={d} fill="none" stroke={EDGE_STROKE} strokeWidth={1.5} />
            {label ? (
              <g>
                <rect
                  x={midX - chipW / 2}
                  y={midY - chipH / 2}
                  width={chipW}
                  height={chipH}
                  rx={chipH / 2}
                  fill="var(--bg-elevated)"
                  stroke="var(--border-wire)"
                />
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-heading)"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  {label}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
