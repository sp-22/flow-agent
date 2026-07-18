import * as React from 'react';
import { Play, Pause, Square } from 'lucide-react';
import type { RecordingHandle } from '../../services/recording.service';
import { RecordingDot } from '../../components/RecordingDot';
import { Waveform } from '../../components/Waveform';

export interface RecordingOverlayProps {
  handle: RecordingHandle;
  onStop(): void;
}

function formatTimer(seconds: number): string {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function RecordingOverlay({ handle, onStop }: RecordingOverlayProps): JSX.Element {
  const [seconds, setSeconds] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    handle.onTick((secs) => {
      setSeconds(secs);
    });
  }, [handle]);

  const togglePause = React.useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      if (next) {
        handle.pause();
      } else {
        handle.resume();
      }
      return next;
    });
  }, [handle]);

  const stop = React.useCallback(() => {
    handle.stop();
    onStop();
  }, [handle, onStop]);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-40 border-2 border-signal"
        aria-hidden="true"
      />

      <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-wire bg-surface px-4 py-2 shadow-none">
          <RecordingDot />
          <Waveform level={paused ? 0 : 1} />
          <button
            type="button"
            onClick={togglePause}
            aria-label={paused ? 'Resume' : 'Pause'}
            className="flex items-center text-body hover:text-heading"
          >
            {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop"
            className="flex items-center gap-1.5 text-sm text-body hover:text-heading"
          >
            <Square size={13} aria-hidden="true" />
            Stop
          </button>
          <span className="font-mono text-sm tabular-nums text-heading">
            {formatTimer(seconds)}
          </span>
        </div>
      </div>
    </>
  );
}
