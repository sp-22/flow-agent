import * as React from 'react';
import { SEED_WORKFLOWS } from '../mock/workflows';
import type { Workflow } from '../types';

export interface WorkflowsContextValue {
  workflows: Workflow[];
  getById(id: string): Workflow | undefined;
  addDraft(w: Workflow): void;
  save(id: string): void;
  update(id: string, patch: Partial<Workflow>): void;
  remove(id: string): void;
  duplicate(id: string): void;
}

const WorkflowsContext = React.createContext<WorkflowsContextValue | undefined>(undefined);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function uniqueId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) return base;
  let n = 2;
  while (existingIds.has(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}

export function WorkflowsProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [workflows, setWorkflows] = React.useState<Workflow[]>(() => SEED_WORKFLOWS);

  const getById = React.useCallback(
    (id: string) => workflows.find((w) => w.id === id),
    [workflows]
  );

  const addDraft = React.useCallback((w: Workflow) => {
    setWorkflows((prev) => [...prev, w]);
  }, []);

  const save = React.useCallback((id: string) => {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, draft: false } : w)));
  }, []);

  const update = React.useCallback((id: string, patch: Partial<Workflow>) => {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const remove = React.useCallback((id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const duplicate = React.useCallback((id: string) => {
    setWorkflows((prev) => {
      const source = prev.find((w) => w.id === id);
      if (!source) return prev;
      const existingIds = new Set(prev.map((w) => w.id));
      const baseId = `${source.id}-copy`;
      const newId = uniqueId(slugify(baseId), existingIds);
      const copy: Workflow = { ...source, id: newId, name: `${source.name} (copy)`, draft: true };
      return [...prev, copy];
    });
  }, []);

  const value = React.useMemo<WorkflowsContextValue>(
    () => ({ workflows, getById, addDraft, save, update, remove, duplicate }),
    [workflows, getById, addDraft, save, update, remove, duplicate]
  );

  return <WorkflowsContext.Provider value={value}>{children}</WorkflowsContext.Provider>;
}

export function useWorkflows(): WorkflowsContextValue {
  const ctx = React.useContext(WorkflowsContext);
  if (!ctx) {
    throw new Error('useWorkflows must be used within a WorkflowsProvider');
  }
  return ctx;
}
