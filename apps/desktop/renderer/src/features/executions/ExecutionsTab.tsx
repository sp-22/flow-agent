import { useExecutions } from '../../store/executions.store';
import { TaskSidebar } from './TaskSidebar';
import { NewTaskView } from './NewTaskView';

export function ExecutionsTab(): JSX.Element {
  const { active } = useExecutions();
  const showNewTaskView = !active || active.messages.length === 0;

  return (
    <div className="flex h-full">
      <TaskSidebar />
      <div className="flex-1 overflow-y-auto">
        {showNewTaskView ? (
          <NewTaskView />
        ) : (
          // Task 13 will render the full conversation thread here.
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Conversation view coming in a later task.
          </div>
        )}
      </div>
    </div>
  );
}
