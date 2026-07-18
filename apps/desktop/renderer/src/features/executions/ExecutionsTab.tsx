import { TaskSidebar } from './TaskSidebar';
import { Conversation } from './Conversation';

export function ExecutionsTab(): JSX.Element {
  return (
    <div className="flex h-full">
      <TaskSidebar />
      <div className="flex-1 overflow-y-auto">
        <Conversation />
      </div>
    </div>
  );
}
