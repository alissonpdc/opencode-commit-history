import { describe, expect, it } from "vitest";
import { parseCommitLog } from "../src/git/log-parser";
import type { CommitRecord } from "../src/git/types";

const SEP = "\x1f";
const RECORD = "\x1e";

function logOutput(rows: string[][]): string {
  return rows.map((row) => row.join(SEP)).join(RECORD) + RECORD;
}

describe("parseCommitLog", () => {
  it("parses hash, subject and date preserving git's most-recent-first order", () => {
    const output = logOutput([
      ["a1b2c3d", "fix sidebar overflow", "2026-11-18T09:41:00-03:00"],
      ["e4f5a6b", "add parser tests", "2026-11-17T18:02:00-03:00"],
    ]);

    const commits = parseCommitLog(output, 8);

    expect(commits).toEqual<CommitRecord[]>([
      { hash: "a1b2c3d", subject: "fix sidebar overflow", date: "2026-11-18T09:41:00-03:00" },
      { hash: "e4f5a6b", subject: "add parser tests", date: "2026-11-17T18:02:00-03:00" },
    ]);
  });

  it("keeps at most the requested number of commits", () => {
    const rows = Array.from({ length: 12 }, (_, index) => [
      `h${String(index).padStart(2, "0")}`,
      `commit ${index}`,
      "2026-11-18T00:00:00Z",
    ]);

    const commits = parseCommitLog(logOutput(rows), 8);

    expect(commits).toHaveLength(8);
    expect(commits[0]?.hash).toBe("h00");
    expect(commits[7]?.hash).toBe("h07");
  });

  it("ignores the empty trailing record and blank lines", () => {
    const output = "\n" + logOutput([["a1b2c3d", "only commit", "2026-11-18T09:41:00Z"]]) + "\n";

    const commits = parseCommitLog(output, 8);

    expect(commits).toEqual<CommitRecord[]>([
      { hash: "a1b2c3d", subject: "only commit", date: "2026-11-18T09:41:00Z" },
    ]);
  });

  it("returns no commits for empty output (repository without commits)", () => {
    expect(parseCommitLog("", 8)).toEqual([]);
  });
});
