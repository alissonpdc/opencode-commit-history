/**
 * Fast polling loop for a cheap read (branch + porcelain status): reports only
 * transitions between distinct values, suppressing repeats and failed reads.
 */
export interface LightPollOptions<Sample> {
  readonly intervalMs: number;
  /** Null (or a throw) marks the tick as failed and keeps the previous baseline. */
  readonly read: () => Promise<Sample | null>;
  readonly isEqual: (a: Sample, b: Sample) => boolean;
  readonly onChange: (next: Sample) => void;
}

export interface LightPoll {
  start(): void;
  dispose(): void;
}

export function createLightPoll<Sample>(options: LightPollOptions<Sample>): LightPoll {
  const { intervalMs, read, isEqual, onChange } = options;
  let timer: ReturnType<typeof setInterval> | null = null;
  let baseline: Sample | null = null;
  let disposed = false;

  const tick = async (): Promise<void> => {
    let next: Sample | null;
    try {
      next = await read();
    } catch {
      return;
    }
    if (disposed || next === null) return;
    const first = baseline === null;
    const previous = baseline;
    baseline = next;
    if (!first && previous !== null && !isEqual(previous, next)) onChange(next);
  };

  return {
    start() {
      if (timer !== null) return;
      void tick();
      timer = setInterval(() => void tick(), intervalMs);
    },
    dispose() {
      disposed = true;
      if (timer !== null) clearInterval(timer);
      timer = null;
    },
  };
}
