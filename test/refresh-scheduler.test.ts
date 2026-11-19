import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncedAction } from "../src/refresh-scheduler";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createDebouncedAction", () => {
  it("runs the action once after the trailing delay", async () => {
    const action = vi.fn(async () => {});
    const schedule = createDebouncedAction(action, 500);

    schedule();
    expect(action).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("coalesces a burst of requests into one trailing run", async () => {
    const action = vi.fn(async () => {});
    const schedule = createDebouncedAction(action, 500);

    schedule();
    await vi.advanceTimersByTimeAsync(300);
    schedule();
    await vi.advanceTimersByTimeAsync(300);
    schedule();
    await vi.advanceTimersByTimeAsync(500);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does not run again after an already fired request", async () => {
    const action = vi.fn(async () => {});
    const schedule = createDebouncedAction(action, 500);

    schedule();
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(1000);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("returns a dispose that cancels the pending run", async () => {
    const action = vi.fn(async () => {});
    const schedule = createDebouncedAction(action, 500);

    schedule();
    schedule.dispose();
    await vi.advanceTimersByTimeAsync(1000);

    expect(action).not.toHaveBeenCalled();
  });
});
