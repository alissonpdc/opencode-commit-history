import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLightPoll } from "../src/light-poll";

type Sample = { value: string };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function harness(initial: string) {
  let next = initial;
  const read = vi.fn(async (): Promise<Sample> => ({ value: next }));
  const onChange = vi.fn();
  const poll = createLightPoll<Sample>({
    intervalMs: 2000,
    read,
    isEqual: (a, b) => a.value === b.value,
    onChange,
  });
  return {
    poll,
    read,
    onChange,
    set(nextValue: string) {
      next = nextValue;
    },
  };
}

describe("createLightPoll", () => {
  it("fires onChange when a polled read differs from the baseline", async () => {
    const { poll, onChange, set } = harness("clean");

    poll.start();
    await vi.advanceTimersByTimeAsync(2000);
    expect(onChange).not.toHaveBeenCalled();

    set("dirty");
    await vi.advanceTimersByTimeAsync(2000);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ value: "dirty" });
  });

  it("does not refire while the read keeps returning the same value", async () => {
    const { poll, onChange, set } = harness("clean");

    poll.start();
    set("dirty");
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(2000);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ticks immediately for the baseline, then on the configured interval", async () => {
    const { poll, read } = harness("clean");

    poll.start();
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(6000);

    expect(read).toHaveBeenCalledTimes(4);
  });

  it("stops ticking and reporting after dispose", async () => {
    const { poll, read, onChange, set } = harness("clean");

    poll.start();
    poll.dispose();
    set("dirty");
    await vi.advanceTimersByTimeAsync(8000);

    expect(read).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("suppresses reporting for reads that fail", async () => {
    const read = vi.fn(async (): Promise<Sample> => {
      throw new Error("git failed");
    });
    const onChange = vi.fn();
    const poll = createLightPoll<Sample>({
      intervalMs: 2000,
      read,
      isEqual: (a, b) => a.value === b.value,
      onChange,
    });

    poll.start();
    await vi.advanceTimersByTimeAsync(4000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("suppresses reporting for null reads", async () => {
    const read = vi.fn(async (): Promise<Sample | null> => null);
    const onChange = vi.fn();
    const poll = createLightPoll<Sample | null>({
      intervalMs: 2000,
      read,
      isEqual: (a, b) => a?.value === b?.value,
      onChange,
    });

    poll.start();
    await vi.advanceTimersByTimeAsync(4000);

    expect(onChange).not.toHaveBeenCalled();
  });
});
