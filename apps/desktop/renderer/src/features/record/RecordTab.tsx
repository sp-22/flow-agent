import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { startRecording, type RecordingHandle } from '../../services/recording.service';
import { useWorkflows } from '../../store/workflows.store';
import type { Workflow } from '../../types';
import { RecordSetup } from './RecordSetup';
import { RecordingOverlay } from './RecordingOverlay';
import { BuildingScreen } from './BuildingScreen';

type Stage = 'setup' | 'recording' | 'building';

export interface RecordTabProps {
  proxyDown?: boolean;
}

export function RecordTab({ proxyDown = false }: RecordTabProps): JSX.Element {
  const [stage, setStage] = React.useState<Stage>('setup');
  const [name, setName] = React.useState('');
  const handleRef = React.useRef<RecordingHandle | null>(null);
  const { addDraft } = useWorkflows();
  const navigate = useNavigate();

  const handleStart = React.useCallback(() => {
    handleRef.current = startRecording(name);
    setStage('recording');
  }, [name]);

  // If this tab unmounts (e.g. the user navigates away) while a recording is
  // still in flight, its underlying interval would otherwise keep ticking
  // forever — explicit Stop is the only other path that clears it. Stopping
  // here is safe even when the recording was already stopped: stop() just
  // clears an interval, which is idempotent.
  React.useEffect(() => {
    return () => {
      handleRef.current?.stop();
    };
  }, []);

  const handleStop = React.useCallback(() => {
    setStage('building');
  }, []);

  const handleBuildComplete = React.useCallback(
    (draft: Workflow) => {
      addDraft(draft);
      navigate('/workflows/' + draft.id);
    },
    [addDraft, navigate]
  );

  if (stage === 'recording' && handleRef.current) {
    return <RecordingOverlay handle={handleRef.current} onStop={handleStop} />;
  }

  if (stage === 'building') {
    return <BuildingScreen onComplete={handleBuildComplete} />;
  }

  return (
    <RecordSetup
      name={name}
      onNameChange={setName}
      onStart={handleStart}
      proxyDown={proxyDown}
    />
  );
}
