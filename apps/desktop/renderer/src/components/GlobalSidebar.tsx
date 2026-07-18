import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  LayoutGrid,
  Mic,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  SquarePen,
  Star,
  Sun,
} from 'lucide-react';
import { useExecutions } from '../store/executions.store';
import { useTheme } from '../store/theme.store';
import type { Task } from '../types';
import logo from '../assets/logo.png';

export interface GlobalSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function joinClassNames(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

interface TaskRowState {
  renamingId: string | null;
  titleDraft: string;
  menuOpenId: string | null;
  localTitles: Record<string, string>;
  deletedIds: Set<string>;
}

export function GlobalSidebar({ collapsed, onToggleCollapsed }: GlobalSidebarProps): JSX.Element {
  const { recentTasks, pinnedTasks, activeId, newTask, openTask, togglePin } = useExecutions();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Rename/delete are UI affordances only — the store does not expose mutators
  // for them, so they stay local until a later task wires persistence.
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [titleDraft, setTitleDraft] = React.useState('');
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [localTitles, setLocalTitles] = React.useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

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

  const handleNewExecution = () => {
    newTask();
    navigate('/executions');
  };

  const openTaskRow = (id: string) => {
    openTask(id);
    navigate('/executions');
  };

  const rowState: TaskRowState = {
    renamingId,
    titleDraft,
    menuOpenId,
    localTitles,
    deletedIds,
  };

  const renderTaskRow = (task: Task, pinned: boolean): JSX.Element | null => {
    if (rowState.deletedIds.has(task.id)) return null;

    const displayTitle = rowState.localTitles[task.id] ?? task.title;
    const isActive = task.id === activeId;

    return (
      <div
        key={task.id}
        className={joinClassNames(
          'group relative flex items-center rounded-md px-2 py-1.5 transition-colors motion-reduce:transition-none',
          isActive ? 'bg-elevated' : 'hover:bg-elevated'
        )}
      >
        {pinned && (
          <Star size={12} aria-hidden="true" className="mr-1.5 shrink-0 fill-current text-muted" />
        )}

        {rowState.renamingId === task.id ? (
          <input
            autoFocus
            value={rowState.titleDraft}
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
            onClick={() => openTaskRow(task.id)}
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

        {rowState.menuOpenId === task.id && (
          <div className="absolute right-0 top-8 z-10 flex flex-col overflow-hidden rounded-md border border-wire bg-elevated text-sm">
            <button
              type="button"
              className="px-3 py-1.5 text-left text-body hover:bg-surface"
              onClick={() => {
                togglePin(task.id);
                setMenuOpenId(null);
              }}
            >
              {pinned ? 'Unpin' : 'Pin'}
            </button>
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
  };

  return (
    <aside
      data-testid="global-sidebar"
      data-collapsed={collapsed}
      className={joinClassNames(
        'flex h-full shrink-0 flex-col border-r border-wire bg-base',
        collapsed ? 'w-14' : 'w-64'
      )}
    >
      <div
        className={joinClassNames(
          'flex h-11 shrink-0 items-center gap-2 px-4',
          collapsed && 'justify-center px-0'
        )}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-elevated motion-reduce:transition-none"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <img
              src={logo}
              alt="Flow Agent"
              className="h-[18px] w-[18px] shrink-0"
              style={{ filter: 'var(--logo-filter)' }}
            />
          </button>
        ) : (
          <>
            <img
              src={logo}
              alt="Flow Agent"
              className="h-[18px] w-[18px] shrink-0"
              style={{ filter: 'var(--logo-filter)' }}
            />
            <span className="font-display text-sm font-medium tracking-tight text-heading">
              Flow Agent
            </span>
            <div
              className="ml-auto flex items-center gap-0.5"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title="Toggle theme"
                className="flex items-center rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-heading motion-reduce:transition-none"
              >
                {theme === 'dark' ? (
                  <Sun size={16} aria-hidden="true" />
                ) : (
                  <Moon size={16} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="flex items-center rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-heading motion-reduce:transition-none"
              >
                <PanelLeftClose size={16} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-2 pb-3 pt-1">
        <div className={joinClassNames('flex flex-col gap-0.5', collapsed && 'items-center')}>
          <button
            type="button"
            onClick={handleNewExecution}
            title="New Execution"
            aria-label="New Execution"
            className={joinClassNames(
              'flex items-center gap-2 rounded-md text-sm font-medium text-heading transition-colors hover:bg-elevated motion-reduce:transition-none',
              collapsed ? 'h-8 w-8 justify-center' : 'px-2 py-1.5'
            )}
          >
            <SquarePen size={16} aria-hidden="true" className="shrink-0" />
            {!collapsed && <span className="truncate">New Execution</span>}
          </button>

          <NavLink
            to="/workflows"
            title="Workflows"
            className={({ isActive }) =>
              joinClassNames(
                'flex items-center gap-2 rounded-md text-sm transition-colors motion-reduce:transition-none',
                collapsed ? 'h-8 w-8 justify-center' : 'px-2 py-1.5',
                isActive ? 'bg-elevated text-heading' : 'text-body hover:bg-elevated hover:text-heading'
              )
            }
          >
            <LayoutGrid size={16} aria-hidden="true" className="shrink-0" />
            {!collapsed && <span className="truncate">Workflows</span>}
          </NavLink>

          <button
            type="button"
            onClick={() => navigate('/record')}
            title="Create Workflow"
            aria-label="Create Workflow"
            className={joinClassNames(
              'flex items-center gap-2 rounded-md text-sm text-body transition-colors hover:bg-elevated hover:text-heading motion-reduce:transition-none',
              collapsed ? 'h-8 w-8 justify-center' : 'px-2 py-1.5'
            )}
          >
            <Mic size={16} aria-hidden="true" className="shrink-0" />
            {!collapsed && <span className="truncate">Create Workflow</span>}
          </button>
        </div>

        {!collapsed && pinnedTasks.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <p className="px-2 pt-4 pb-1 text-xs font-medium text-muted">Pinned</p>
            {pinnedTasks.map((task) => renderTaskRow(task, true))}
          </div>
        )}

        {!collapsed && (
          <div className="flex flex-col gap-0.5">
            <p className="px-2 pt-4 pb-1 text-xs font-medium text-muted">Recent</p>
            {recentTasks.map((task) => renderTaskRow(task, false))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-wire p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-wire bg-elevated font-mono text-xs text-heading"
              title="Gaurav"
            >
              G
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-elevated motion-reduce:transition-none">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-wire bg-elevated font-mono text-xs text-heading"
              aria-hidden="true"
            >
              G
            </div>
            <span className="flex-1 truncate text-sm text-body">Gaurav</span>
            <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-muted" />
          </div>
        )}
      </div>
    </aside>
  );
}
