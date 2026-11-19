import { describe, expect, it } from "vitest";
import { truncateSubject } from "../src/ui/truncate-subject";

describe("truncateSubject", () => {
  it("keeps short subjects untouched", () => {
    expect(truncateSubject("fix sidebar", 40)).toBe("fix sidebar");
  });

  it("cuts long subjects and appends an ellipsis within the limit", () => {
    const subject = "refactor the whole sidebar rendering pipeline for narrow terminals";
    const truncated = truncateSubject(subject, 40);
    expect(truncated.length).toBe(40);
    expect(truncated.endsWith("…")).toBe(true);
    expect(truncated.startsWith("refactor the whole sidebar rendering")).toBe(true);
  });

  it("shrinks the limit itself when it cannot fit one character of content", () => {
    expect(truncateSubject("abcdef", 1)).toBe("…");
  });
});
