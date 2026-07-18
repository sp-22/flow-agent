import * as React from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import type { FlowGraph } from '../../../types';
import { FlowEdges } from './FlowEdges';
import { FlowNodeCard } from './FlowNodeCard';

export interface FlowCanvasProps {
  graph: FlowGraph;
  selectedNodeId: string | null;
  onSelect(id: string | null): void;
}

type Point = { x: number; y: number };

const MIN_SCALE = 0.4;
const MAX_SCALE = 2;
const DRAG_THRESHOLD = 3;

function initialPositions(graph: FlowGraph): Record<string, Point> {
  const out: Record<string, Point> = {};
  for (const node of graph.nodes) out[node.id] = { x: node.x, y: node.y };
  return out;
}

export function FlowCanvas({ graph, selectedNodeId, onSelect }: FlowCanvasProps): JSX.Element {
  const [positions, setPositions] = React.useState<Record<string, Point>>(() =>
    initialPositions(graph)
  );
  const [scale, setScale] = React.useState(1);

  const scaleRef = React.useRef(scale);
  scaleRef.current = scale;
  const dragRef = React.useRef<{ id: string; startX: number; startY: number; orig: Point } | null>(
    null
  );
  const movedRef = React.useRef(false);

  React.useEffect(() => {
    setPositions(initialPositions(graph));
  }, [graph]);

  React.useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) movedRef.current = true;
      const s = scaleRef.current || 1;
      setPositions((prev) => ({
        ...prev,
        [drag.id]: {
          x: Math.max(0, drag.orig.x + dx / s),
          y: Math.max(0, drag.orig.y + dy / s),
        },
      }));
    };
    const handleUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  if (graph.nodes.length === 0) {
    return <p className="py-12 text-center font-mono text-sm text-muted">No flow steps yet.</p>;
  }

  const positionedNodes = graph.nodes.map((node) => ({
    ...node,
    x: positions[node.id]?.x ?? node.x,
    y: positions[node.id]?.y ?? node.y,
  }));

  const width = Math.max(...positionedNodes.map((n) => n.x + 260), 400);
  const height = Math.max(...positionedNodes.map((n) => n.y + 140), 300);

  const beginDrag = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    movedRef.current = false;
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      orig: positions[id] ?? { x: 0, y: 0 },
    };
  };

  const selectNode = (id: string) => {
    if (movedRef.current) return;
    onSelect(id);
  };

  const clearSelection = () => {
    if (movedRef.current) return;
    onSelect(null);
  };

  const zoomBy = (delta: number) =>
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((s + delta) * 10) / 10)));

  return (
    <div
      className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-wire bg-base"
      style={{
        backgroundImage: 'radial-gradient(circle, var(--border-wire) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      <div
        data-testid="flow-canvas"
        role="presentation"
        onPointerDown={() => {
          movedRef.current = false;
        }}
        onClick={clearSelection}
        className="absolute inset-0 overflow-auto"
      >
        <div style={{ width: width * scale, height: height * scale }}>
          <div
            className="relative"
            style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}
          >
            <FlowEdges nodes={positionedNodes} edges={graph.edges} />
            {positionedNodes.map((node) => (
              <FlowNodeCard
                key={node.id}
                node={node}
                selected={selectedNodeId === node.id}
                onSelect={selectNode}
                onPointerDown={(e) => beginDrag(e, node.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-0.5 rounded-lg border border-wire bg-surface p-1 text-muted">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomBy(-0.1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-elevated hover:text-body"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          onClick={() => setScale(1)}
          className="min-w-[3rem] rounded-md px-1 py-1 text-center font-mono text-xs transition-colors hover:bg-elevated hover:text-body"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomBy(0.1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-elevated hover:text-body"
        >
          <Plus className="h-4 w-4" />
        </button>
        <span className="mx-0.5 h-4 w-px bg-wire" aria-hidden="true" />
        <button
          type="button"
          aria-label="Fit to view"
          onClick={() => setScale(1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-elevated hover:text-body"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
