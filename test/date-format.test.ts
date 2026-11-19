import { describe, expect, it } from "vitest";
import { formatCommitTime } from "../src/git/date-format";

describe("formatCommitTime", () => {
  it("renders day/month and local time in a compact sidebar format", () => {
    expect(formatCommitTime("2026-11-18T12:41:00Z")).toBe("18/11 12:41");
  });

  it("zero-pads single digit days, months and minutes", () => {
    expect(formatCommitTime("2026-01-05T03:07:00Z")).toBe("05/01 03:07");
  });

  it("converts the instant to the requested IANA timezone", () => {
    expect(formatCommitTime("2026-11-19T00:10:00Z", "America/Sao_Paulo")).toBe("18/11 21:10");
  });

  it("keeps the day boundary consistent with the requested timezone", () => {
    expect(formatCommitTime("2026-11-18T02:30:00Z", "Asia/Tokyo")).toBe("18/11 11:30");
  });

  it("falls back to process-local formatting for invalid timezones", () => {
    expect(formatCommitTime("2026-11-18T12:41:00Z", "Mars/Olympus")).toBe("18/11 12:41");
  });

  it("returns the raw input when it cannot be parsed as a date", () => {
    expect(formatCommitTime("not-a-date")).toBe("not-a-date");
  });
});
