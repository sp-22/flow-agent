const MIC_LEVEL_INTERVAL_MS = 100;
const TICK_INTERVAL_MS = 1000;

/**
 * Subscribes to a stream of random mic levels (0-1) emitted every 100ms.
 * Returns an unsubscribe function that clears the interval. No real IO.
 */
export function subscribeMicLevel(cb: (level: number) => void): () => void {
  const intervalId = setInterval(() => {
    cb(Math.random());
  }, MIC_LEVEL_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
  };
}

export interface RecordingHandle {
  pause(): void;
  resume(): void;
  stop(): void;
  onTick(cb: (seconds: number, calls: number) => void): void;
}

/**
 * Starts a mock recording session for `name`. The returned handle ticks
 * once a second with incrementing elapsed seconds and a slowly climbing
 * "calls" count, until paused or stopped. Pure timer-based stub — no real IO.
 */
export function startRecording(name: string): RecordingHandle {
  void name;

  let seconds = 0;
  let calls = 0;
  let paused = false;
  let stopped = false;
  let tickCb: ((seconds: number, calls: number) => void) | null = null;

  const intervalId = setInterval(() => {
    if (paused || stopped) return;

    seconds += 1;
    if (seconds % 3 === 0) {
      calls += 1;
    }
    tickCb?.(seconds, calls);
  }, TICK_INTERVAL_MS);

  return {
    pause(): void {
      paused = true;
    },
    resume(): void {
      paused = false;
    },
    stop(): void {
      stopped = true;
      clearInterval(intervalId);
    },
    onTick(cb: (seconds: number, calls: number) => void): void {
      tickCb = cb;
    },
  };
}
