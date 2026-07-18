import { ServiceLogo } from '../../../components/ServiceLogo';
import type { FlowNode, FlowNodeKind } from '../../../types';
import { serviceAccent } from './serviceAccent';

export interface FlowNodeCardProps {
  node: FlowNode;
  selected: boolean;
  onSelect(id: string): void;
}

const KIND_LABEL: Record<FlowNodeKind, string> = {
  trigger: 'TRIGGER',
  action: 'ACTION',
  branch: 'BRANCH',
  end: 'END',
};

function kindAccent(node: FlowNode): string {
  if (node.service) return serviceAccent(node.service);
  if (node.kind === 'branch') return 'var(--hold)';
  if (node.kind === 'end') return 'var(--go)';
  return 'var(--border-wire)';
}

export function FlowNodeCard({ node, selected, onSelect }: FlowNodeCardProps): JSX.Element {
  const eyebrow = node.service
    ? `${KIND_LABEL[node.kind]} \u00b7 ${node.service.toUpperCase()}`
    : KIND_LABEL[node.kind];

  return (
    <button
      type="button"
      role="button"
      aria-selected={selected}
      aria-label={node.title}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={[
        'absolute flex w-[220px] flex-col gap-1.5 rounded-lg border bg-surface p-3 text-left',
        'transition-colors duration-150 ease-[var(--ease)]',
        selected ? 'border-high border-2' : 'border-wire hover:border-wire-hover',
      ].join(' ')}
      style={{ left: node.x, top: node.y }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-sm text-heading"
        style={{ background: kindAccent(node) }}
      />
      <div className="flex items-center gap-1.5 pl-1.5">
        {node.service ? <ServiceLogo name={node.service} size={12} /> : null}
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{eyebrow}</span>
      </div>
      <p className="pl-1.5 font-display text-sm font-medium text-heading">{node.title}</p>
      {node.subtitle ? (
        <p className="pl-1.5 font-mono text-xs text-muted">{node.subtitle}</p>
      ) : null}
      {node.status && node.status !== 'idle' ? (
        <div className="flex items-center gap-1.5 pl-1.5 pt-0.5">
          <span
            className={[
              'font-mono text-xs',
              node.status === 'passed' ? 'text-go' : 'text-signal',
            ].join(' ')}
          >
            {node.status === 'passed' ? 'Passed' : 'Failed'}
          </span>
          {node.durationLabel ? (
            <span className="font-mono text-xs text-muted">{node.durationLabel}</span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
