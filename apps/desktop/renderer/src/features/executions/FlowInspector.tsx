import * as React from 'react';
import { X } from 'lucide-react';
import type { Workflow } from '../../types';
import { Mermaid } from '../../components/Mermaid';

export interface FlowInspectorProps {
  /** Preferred source — supplies name and mermaid in one object. */
  workflow?: Workflow;
  /** Fallback fields used when no workflow is associated (e.g. free-text runs). */
  name?: string;
  steps?: string[];
  mermaid?: string;
  /** Kept for API compatibility; step highlighting now lives in the chat thread. */
  activeIndex?: number;
  onClose: () => void;
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 960;
const DEFAULT_WIDTH = 460;

// Force any flowchart/graph to render top-to-bottom so the panel reads as a
// vertical flow. Leaves the chart untouched when no direction is declared.
function toVertical(chart: string): string {
  const directionRe = /^(\s*(?:flowchart|graph))\s+(TB|TD|BT|RL|LR)\b/im;
  return directionRe.test(chart) ? chart.replace(directionRe, '$1 TD') : chart;
}

export function FlowInspector({ workflow, mermaid, onClose }: FlowInspectorProps): JSX.Element {
  const rawMermaid = workflow?.mermaid ?? mermaid;
  const flowMermaid = rawMermaid ? toVertical(rawMermaid) : undefined;

  const [width, setWidth] = React.useState(DEFAULT_WIDTH);
  const dragRef = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startWidth: width };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    // Panel is docked to the right, so dragging its left edge leftwards widens it.
    const next = drag.startWidth + (drag.startX - e.clientX);
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <aside
      aria-label="Flow inspector"
      style={{ width }}
      className="relative flex h-full shrink-0 flex-col overflow-hidden border-l border-wire bg-surface"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize flow inspector"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition-colors duration-150 ease-[var(--ease)] hover:bg-wire-hover"
      />

      <div className="flex items-center justify-between gap-2 border-b border-wire px-4 py-3">
        <h2 className="truncate font-display text-heading">Flow</h2>
        <button
          type="button"
          aria-label="Close flow inspector"
          onClick={onClose}
          className="flex items-center rounded-md px-1.5 py-1 text-muted transition-colors duration-150 ease-[var(--ease)] hover:bg-elevated hover:text-heading"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {flowMermaid ? <Mermaid chart={flowMermaid} /> : null}
      </div>
    </aside>
  );
}
