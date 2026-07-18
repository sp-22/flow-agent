import { renderHook, act } from '@testing-library/react';
import { ExecutionsProvider, useExecutions } from './executions.store';

test('seeds pinned tasks from the mock data', () => {
  const { result } = renderHook(() => useExecutions(), { wrapper: ExecutionsProvider });
  expect(result.current.pinnedTasks.map((t) => t.id)).toContain('task-1');
  expect(result.current.recentTasks.map((t) => t.id)).not.toContain('task-1');
});

test('togglePin moves a task between pinned and recent', () => {
  const { result } = renderHook(() => useExecutions(), { wrapper: ExecutionsProvider });

  act(() => result.current.togglePin('task-1'));
  expect(result.current.pinnedTasks.map((t) => t.id)).not.toContain('task-1');
  expect(result.current.recentTasks.map((t) => t.id)).toContain('task-1');

  act(() => result.current.togglePin('task-2'));
  expect(result.current.pinnedTasks.map((t) => t.id)).toContain('task-2');
});

test('sending a /workflow mention sets the active workflow id', () => {
  vi.useFakeTimers();
  try {
    const { result } = renderHook(() => useExecutions(), { wrapper: ExecutionsProvider });
    act(() => result.current.newTask());
    act(() => {
      void result.current.send('/Deploy Check run it now');
    });
    expect(result.current.activeWorkflowId).toBe('deploy-check');
  } finally {
    vi.useRealTimers();
  }
});
