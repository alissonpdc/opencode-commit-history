import { describe, expect, it } from "vitest";
import { formatCommitTime } from "../src/git/date-format";

describe("formatCommitTime", () => {
  it("renders day/month and local time in a compact sidebar format", () => {
    expect(formatCommitTime("2026-11-18T12:41:00Z")).toBe("18/11 12:41");
  });

  it("zero-pads single digit days, months and minutes", () => {
    expect(formatCommitTime("2026-01-05T03:07:00Z")).toBe("05/01 03:07");
  });

  it("returns the raw input when it cannot be parsed as a date", () => {
    expect(formatCommitTime("not-a-date")).toBe("not-a-date");
  });
});
