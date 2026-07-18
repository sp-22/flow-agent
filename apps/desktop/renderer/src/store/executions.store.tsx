import * as React from 'react';
import { SEED_TASKS } from '../mock/tasks';
import { runTask } from '../services/execution.service';
import type { ChatMessage, Task } from '../types';

export interface ExecutionsContextValue {
  tasks: Task[];
  activeId: string | null;
  active: Task | null;
  newTask(): void;
  openTask(id: string): void;
  preload(workflowName: string): void;
  pendingPrompt: string;
  setPendingPrompt(v: string): void;
  send(text: string): Promise<void>;
}

const ExecutionsContext = React.createContext<ExecutionsContextValue | undefined>(undefined);

let draftCounter = 0;
function nextDraftId(): string {
  draftCounter += 1;
  return `task-draft-${draftCounter}`;
}

export function ExecutionsProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [tasks, setTasks] = React.useState<Task[]>(() => SEED_TASKS);
  const [activeId, setActiveId] = React.useState<string | null>(SEED_TASKS[0]?.id ?? null);
  const [draftTask, setDraftTask] = React.useState<Task | null>(null);
  const [pendingPrompt, setPendingPrompt] = React.useState('');

  const active = React.useMemo(() => {
    if (draftTask && draftTask.id === activeId) return draftTask;
    return tasks.find((t) => t.id === activeId) ?? null;
  }, [tasks, activeId, draftTask]);

  const newTask = React.useCallback(() => {
    const draft: Task = {
      id: nextDraftId(),
      title: 'New Task',
      createdRelative: 'Just now',
      messages: [],
    };
    setDraftTask(draft);
    setActiveId(draft.id);
    setPendingPrompt('');
  }, []);

  const openTask = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const preload = React.useCallback((workflowName: string) => {
    setPendingPrompt(`/${workflowName} `);
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
      };

      if (draftTask && draftTask.id === targetId) {
        // First message on a fresh draft — materialize it into Recents.
        const finalized: Task = {
          ...draftTask,
          title: trimmed.slice(0, 60),
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

      const applyProgress = (progress: NonNullable<ChatMessage['progress']>, finalText?: string) => {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== targetId) return t;
            return {
              ...t,
              messages: t.messages.map((m) =>
                m.id === agentMessageId ? { ...m, progress, text: finalText ?? m.text } : m
              ),
            };
          })
        );
      };

      const steps: NonNullable<ChatMessage['progress']> = [];
      const summary = await runTask(trimmed, (step) => {
        steps.push(step);
        applyProgress([...steps]);
      });

      applyProgress([...steps], summary);
    },
    [activeId, draftTask]
  );

  const value = React.useMemo<ExecutionsContextValue>(
    () => ({ tasks, activeId, active, newTask, openTask, preload, pendingPrompt, setPendingPrompt, send }),
    [tasks, activeId, active, newTask, openTask, preload, pendingPrompt, send]
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
