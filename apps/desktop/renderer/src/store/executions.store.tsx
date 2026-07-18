import * as React from 'react';
import { SEED_TASKS } from '../mock/tasks';
import { SEED_WORKFLOWS } from '../mock/workflows';
import { runTask } from '../services/execution.service';
import { getSelectedAdapter } from '../services/adapter.service';
import type { ChatMessage, Task } from '../types';

export interface ExecutionsContextValue {
  tasks: Task[];
  recentTasks: Task[];
  pinnedTasks: Task[];
  activeId: string | null;
  active: Task | null;
  activeWorkflowId: string | null;
  newTask(): void;
  openTask(id: string): void;
  togglePin(id: string): void;
  preload(workflowName: string): void;
  runWorkflow(workflowName: string): Promise<void>;
  pendingPrompt: string;
  setPendingPrompt(v: string): void;
  send(text: string): Promise<void>;
}

/**
 * Resolves a `/Workflow Name ...` mention to a workflow id. Workflow names can
 * contain spaces, so we match the longest workflow name that is a prefix of the
 * text following the leading slash (case-insensitive).
 */
function workflowIdFromMention(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return undefined;
  const rest = trimmed.slice(1).toLowerCase();
  const match = SEED_WORKFLOWS.filter((w) => rest.startsWith(w.name.toLowerCase())).sort(
    (a, b) => b.name.length - a.name.length
  )[0];
  return match?.id;
}

const ExecutionsContext = React.createContext<ExecutionsContextValue | undefined>(undefined);

let draftCounter = 0;
function nextDraftId(): string {
  draftCounter += 1;
  return `task-draft-${draftCounter}`;
}

function createDraftTask(): Task {
  return {
    id: nextDraftId(),
    title: 'New Task',
    createdRelative: 'Just now',
    messages: [],
  };
}

export function ExecutionsProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [tasks, setTasks] = React.useState<Task[]>(() => SEED_TASKS);
  const [activeId, setActiveId] = React.useState<string | null>(SEED_TASKS[0]?.id ?? null);
  const [draftTask, setDraftTask] = React.useState<Task | null>(null);
  const [pendingPrompt, setPendingPrompt] = React.useState('');
  const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(
    () => new Set(SEED_TASKS.filter((t) => t.pinned).map((t) => t.id))
  );

  const active = React.useMemo(() => {
    if (draftTask && draftTask.id === activeId) return draftTask;
    return tasks.find((t) => t.id === activeId) ?? null;
  }, [tasks, activeId, draftTask]);

  const activeWorkflowId = active?.workflowId ?? null;

  const pinnedTasks = React.useMemo(() => tasks.filter((t) => pinnedIds.has(t.id)), [tasks, pinnedIds]);
  const recentTasks = React.useMemo(() => tasks.filter((t) => !pinnedIds.has(t.id)), [tasks, pinnedIds]);

  const togglePin = React.useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const newTask = React.useCallback(() => {
    const draft = createDraftTask();
    setDraftTask(draft);
    setActiveId(draft.id);
    setPendingPrompt('');
  }, []);

  const openTask = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const preload = React.useCallback((workflowName: string) => {
    // Start a fresh task first (same as newTask) so the mention lands in an
    // empty task's input rather than inside whatever task was previously
    // active.
    const draft = createDraftTask();
    setDraftTask(draft);
    setActiveId(draft.id);
    setPendingPrompt(`/${workflowName} `);
  }, []);

  // Streams a run's progress into the agent message of a given task.
  const streamRun = React.useCallback(async (targetId: string, agentMessageId: string, text: string) => {
    const applyProgress = (
      progress: NonNullable<ChatMessage['progress']>,
      opts?: { finalText?: string; pending?: boolean }
    ) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== targetId) return t;
          return {
            ...t,
            messages: t.messages.map((m) =>
              m.id === agentMessageId
                ? {
                    ...m,
                    progress,
                    text: opts?.finalText ?? m.text,
                    ...(opts?.pending !== undefined ? { pending: opts.pending } : {}),
                  }
                : m
            ),
          };
        })
      );
    };

    const steps: NonNullable<ChatMessage['progress']> = [];
    const runId = `${targetId}-${Date.now()}`;
    try {
      const summary = await runTask(text, getSelectedAdapter(), (step) => {
        steps.push(step);
        applyProgress([...steps]);
      }, runId);
      applyProgress([...steps], { finalText: summary, pending: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Adapter run failed';
      applyProgress([...steps], { finalText: `⚠ ${message}`, pending: false });
    }
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const targetId = draftTask && draftTask.id === activeId ? draftTask.id : activeId;
      if (!targetId) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        text: trimmed,
      };
      const agentMessageId = `msg-${Date.now()}-agent`;
      const agentMessage: ChatMessage = {
        id: agentMessageId,
        role: 'agent',
        text: 'Running…',
        progress: [],
        pending: true,
      };

      if (draftTask && draftTask.id === targetId) {
        // First message on a fresh draft — materialize it into Recents.
        const finalized: Task = {
          ...draftTask,
          title: trimmed.slice(0, 60),
          workflowId: workflowIdFromMention(trimmed) ?? draftTask.workflowId,
          messages: [userMessage, agentMessage],
        };
        setTasks((prev) => [finalized, ...prev]);
        setDraftTask(null);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, messages: [...t.messages, userMessage, agentMessage] } : t))
        );
      }

      setPendingPrompt('');

      await streamRun(targetId, agentMessageId, trimmed);
    },
    [activeId, draftTask, streamRun]
  );

  // Immediately starts executing a workflow in a fresh task, without requiring
  // the user to submit the prompt manually.
  const runWorkflow = React.useCallback(
    async (workflowName: string) => {
      const text = `/${workflowName}`;
      const draft = createDraftTask();
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        text,
      };
      const agentMessageId = `msg-${Date.now()}-agent`;
      const agentMessage: ChatMessage = {
        id: agentMessageId,
        role: 'agent',
        text: 'Running…',
        progress: [],
        pending: true,
      };
      const finalized: Task = {
        ...draft,
        title: workflowName,
        workflowId: workflowIdFromMention(text) ?? draft.workflowId,
        messages: [userMessage, agentMessage],
      };
      setTasks((prev) => [finalized, ...prev]);
      setDraftTask(null);
      setActiveId(finalized.id);
      setPendingPrompt('');

      await streamRun(finalized.id, agentMessageId, text);
    },
    [streamRun]
  );

  const value = React.useMemo<ExecutionsContextValue>(
    () => ({
      tasks,
      recentTasks,
      pinnedTasks,
      activeId,
      active,
      activeWorkflowId,
      newTask,
      openTask,
      togglePin,
      preload,
      runWorkflow,
      pendingPrompt,
      setPendingPrompt,
      send,
    }),
    [
      tasks,
      recentTasks,
      pinnedTasks,
      activeId,
      active,
      activeWorkflowId,
      newTask,
      openTask,
      togglePin,
      preload,
      runWorkflow,
      pendingPrompt,
      send,
    ]
  );

  return <ExecutionsContext.Provider value={value}>{children}</ExecutionsContext.Provider>;
}

export function useExecutions(): ExecutionsContextValue {
  const ctx = React.useContext(ExecutionsContext);
  if (!ctx) {
    throw new Error('useExecutions must be used within an ExecutionsProvider');
  }
  return ctx;
}
