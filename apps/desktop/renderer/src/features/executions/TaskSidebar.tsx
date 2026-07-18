import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/Button';
import { useExecutions } from '../../store/executions.store';

export function TaskSidebar(): JSX.Element {
  const { tasks, activeId, newTask, openTask } = useExecutions();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [titleDraft, setTitleDraft] = React.useState('');
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);

  // Rename/delete are UI affordances only for this task — the store does not
  // yet expose mutators for them, so they are local-only until a later task
  // wires persistence.
  const [localTitles, setLocalTitles] = React.useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

  const visible = tasks.filter((t) => !deletedIds.has(t.id));

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setTitleDraft(currentTitle);
    setMenuOpenId(null);
  };

  const commitRename = (id: string) => {
    const trimmed = titleDraft.trim();
    if (trimmed) {
      setLocalTitles((prev) => ({ ...prev, [id]: trimmed }));
    }
    setRenamingId(null);
  };

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    setMenuOpenId(null);
  };

  return (
    <aside className="flex h-full w-64 flex-col gap-3 border-r border-wire bg-base p-3">
      <Button variant="primary" size="md" className="w-full justify-center" onClick={newTask}>
        + New Task
      </Button>

      <div className="flex flex-col gap-1 overflow-y-auto">
        <p className="px-2 py-1 font-mono text-xs uppercase tracking-wide text-muted">Recents</p>

        {visible.map((task) => {
          const displayTitle = localTitles[task.id] ?? task.title;
          const isActive = task.id === activeId;

          return (
            <div
              key={task.id}
              className={`group relative flex items-center rounded-md px-2 py-1.5 ${
                isActive ? 'bg-elevated' : 'hover:bg-elevated'
              }`}
            >
              {renamingId === task.id ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => commitRename(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(task.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full rounded border border-wire bg-surface px-1.5 py-0.5 text-sm text-heading outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openTask(task.id)}
                  className="flex-1 truncate text-left text-sm text-body hover:text-heading"
                >
                  {displayTitle}
                </button>
              )}

              <button
                type="button"
                aria-label="Task options"
                onClick={() => setMenuOpenId((v) => (v === task.id ? null : task.id))}
                className="ml-1 flex items-center rounded px-1 py-1 text-muted opacity-0 hover:text-heading group-hover:opacity-100"
              >
                <MoreHorizontal size={15} aria-hidden="true" />
              </button>

              {menuOpenId === task.id && (
                <div className="absolute right-0 top-8 z-10 flex flex-col overflow-hidden rounded-md border border-wire bg-elevated text-sm shadow-none">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-left text-body hover:bg-surface"
                    onClick={() => startRename(task.id, displayTitle)}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-left text-signal hover:bg-surface"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
