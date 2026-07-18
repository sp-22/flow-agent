import * as React from 'react';
import type { FlowNode, FlowNodeKind } from '../../../types';

export interface FlowNodeCardProps {
  node: FlowNode;
  selected: boolean;
  onSelect(id: string): void;
  onPointerDown?(e: React.PointerEvent): void;
}

const KIND_LABEL: Record<FlowNodeKind, string> = {
  trigger: 'TRIGGER',
  action: 'ACTION',
  branch: 'BRANCH',
  end: 'END',
};

export function FlowNodeCard({
  node,
  selected,
  onSelect,
  onPointerDown,
}: FlowNodeCardProps): JSX.Element {
  const eyebrow = node.service
    ? `${KIND_LABEL[node.kind]} \u00b7 ${node.service.toUpperCase()}`
    : KIND_LABEL[node.kind];

  return (
    <button
      type="button"
      role="button"
      aria-selected={selected}
      aria-label={node.title}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={[
        'absolute flex w-[220px] cursor-grab touch-none select-none flex-col gap-1.5 rounded-lg border bg-surface p-3 text-left active:cursor-grabbing',
        'transition-colors duration-150 ease-[var(--ease)]',
        selected ? 'border-high border-2' : 'border-wire hover:border-wire-hover',
      ].join(' ')}
      style={{ left: node.x, top: node.y }}
    >
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{eyebrow}</span>
      <p className="font-display text-sm font-medium text-heading">{node.title}</p>
      {node.subtitle ? (
        <p className="font-mono text-xs text-muted">{node.subtitle}</p>
      ) : null}
    </button>
  );
}
