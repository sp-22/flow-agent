import { Route, Routes } from 'react-router-dom';
import { WorkflowEditor } from './WorkflowEditor';
import { WorkflowGrid } from './WorkflowGrid';

export function WorkflowsTab(): JSX.Element {
  return (
    <Routes>
      <Route index element={<WorkflowGrid />} />
      <Route path=":id" element={<WorkflowEditor />} />
    </Routes>
  );
}
