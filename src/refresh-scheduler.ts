/** Trailing debounce: coalesces bursts (e.g. filesystem events) into one delayed run. */
export interface DebouncedSchedule {
  (): void;
  dispose(): void;
}

export function createDebouncedAction(action: () => Promise<void>, delayMs: number): DebouncedSchedule {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = (() => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void action();
    }, delayMs);
  }) as DebouncedSchedule;
  schedule.dispose = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  return schedule;
}
