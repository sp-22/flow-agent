import * as React from 'react';
import { MoreHorizontal, Play } from 'lucide-react';
import { Card } from '../../components/Card';
import { WorkflowIcon } from '../../components/WorkflowIcon';
import { ServiceTag } from '../../components/ServiceTag';
import { Sparkline } from '../../components/Sparkline';
import { StatusDot } from '../../components/StatusDot';
import { Button } from '../../components/Button';
import { useWorkflows } from '../../store/workflows.store';
import type { Workflow } from '../../types';

export interface WorkflowCardProps {
  workflow: Workflow;
  onOpen(): void;
  onRun(): void;
}

export function WorkflowCard({ workflow, onOpen, onRun }: WorkflowCardProps): JSX.Element {
  const { update, remove, duplicate } = useWorkflows();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(workflow.name);

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== workflow.name) {
      update(workflow.id, { name: trimmed });
    } else {
      setNameDraft(workflow.name);
    }
    setRenaming(false);
  };

  return (
    <Card className="group relative flex flex-col gap-3 p-4">
      <button
        type="button"
        aria-label="Workflow options"
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute right-3 top-3 flex items-center rounded-md px-1.5 py-1 text-muted opacity-0 transition-opacity duration-150 ease-[var(--ease)] hover:text-heading group-hover:opacity-100"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>

      {menuOpen && (
        <div className="absolute right-3 top-9 z-10 flex flex-col overflow-hidden rounded-md border border-wire bg-elevated text-sm shadow-none">
          <button
            type="button"
            className="px-3 py-1.5 text-left text-body hover:bg-surface"
            onClick={() => {
              setRenaming(true);
              setMenuOpen(false);
            }}
          >
            Rename
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-left text-body hover:bg-surface"
            onClick={() => {
              duplicate(workflow.id);
              setMenuOpen(false);
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-left text-signal hover:bg-surface"
            onClick={() => {
              remove(workflow.id);
              setMenuOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 pr-6">
        <span className="flex items-center leading-none" aria-hidden="true">
          <WorkflowIcon name={workflow.icon} size={18} />
        </span>
        {renaming ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setNameDraft(workflow.name);
                setRenaming(false);
              }
            }}
            className="w-full rounded border border-wire bg-base px-1.5 py-0.5 font-display text-sm text-heading outline-none"
          />
        ) : (
          <h3 className="truncate font-display text-sm font-medium text-heading">{workflow.name}</h3>
        )}
      </div>

      <p className="line-clamp-2 text-sm text-muted">{workflow.description}</p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {workflow.services.map((service) => (
            <ServiceTag key={service} name={service} />
          ))}
        </div>
        <Sparkline data={workflow.runSparkline} />
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-wire pt-3">
        <div className="flex items-center gap-1.5">
          <StatusDot tone={workflow.health} title="Health" />
          <span className="font-mono text-xs text-muted">ran {workflow.lastRunRelative}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onOpen}>
            View/Edit
          </Button>
          <Button variant="primary" size="sm" onClick={onRun}>
            <Play size={13} aria-hidden="true" />
            Run
          </Button>
        </div>
      </div>
    </Card>
  );
}
