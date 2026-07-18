import * as React from 'react';
import { Copy, Eye, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { WorkflowIcon } from '../../components/WorkflowIcon';
import { ServiceTag } from '../../components/ServiceTag';
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

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`Open ${workflow.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group relative flex cursor-pointer flex-col gap-3 p-4"
    >
      <button
        type="button"
        aria-label="Workflow options"
        onClick={(e) => {
          stop(e);
          setMenuOpen((v) => !v);
        }}
        className="absolute right-3 top-3 flex items-center rounded-md px-1.5 py-1 text-muted opacity-0 transition-opacity duration-150 ease-[var(--ease)] hover:text-heading group-hover:opacity-100"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>

      {menuOpen && (
        <div
          className="absolute right-3 top-9 z-10 flex min-w-[8.5rem] flex-col overflow-hidden rounded-md border border-wire bg-elevated text-sm shadow-none"
          onClick={stop}
        >
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-left text-body hover:bg-surface"
            onClick={() => {
              setMenuOpen(false);
              onOpen();
            }}
          >
            <Eye size={14} aria-hidden="true" />
            View
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-left text-body hover:bg-surface"
            onClick={() => {
              setRenaming(true);
              setMenuOpen(false);
            }}
          >
            <Pencil size={14} aria-hidden="true" />
            Rename
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-left text-body hover:bg-surface"
            onClick={() => {
              duplicate(workflow.id);
              setMenuOpen(false);
            }}
          >
            <Copy size={14} aria-hidden="true" />
            Clone
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-left text-signal hover:bg-surface"
            onClick={() => {
              remove(workflow.id);
              setMenuOpen(false);
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
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
            onClick={stop}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              stop(e);
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

      <div className="flex flex-wrap items-center gap-1.5">
        {workflow.services.map((service) => (
          <ServiceTag key={service} name={service} />
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-wire pt-3">
        <div className="flex items-center gap-1.5">
          <StatusDot tone={workflow.health} title="Health" />
          <span className="font-mono text-xs text-muted">ran {workflow.lastRunRelative}</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            stop(e);
            onRun();
          }}
        >
          <Play size={13} aria-hidden="true" />
          Execute
        </Button>
      </div>
    </Card>
  );
}
