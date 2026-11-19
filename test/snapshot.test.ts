import { describe, expect, it } from "vitest";
import { createSnapshotReader } from "../src/git/snapshot";
import type { GitCommandRunner } from "../src/git/types";

/** Named fake: canned git stdout per command, records every invocation. */
class FakeGitRunner {
  readonly calls: string[][] = [];
  failingCommand: string | null = null;

  constructor(private readonly outputs: Record<string, string>) {}

  /** Arrow property keeps `this` bound when the method is passed around. */
  readonly run = async (args: readonly string[]): Promise<string> => {
    const command = args.join(" ");
    this.calls.push([...args]);
    if (this.failingCommand === command) {
      throw new Error(`git ${command} failed (fake)`);
    }
    const output = this.outputs[command];
    if (output === undefined) {
      throw new Error(`unexpected git command: ${command}`);
    }
    return output;
  };
}

function cannedRunner(): FakeGitRunner {
  return new FakeGitRunner({
    "rev-parse --show-toplevel": "/repo\n",
    "rev-parse --absolute-git-dir": "/repo/.git\n",
    "rev-parse --git-common-dir": ".git\n",
    "branch --show-current": "main\n",
    "log -8 --pretty=format:%h%x1f%s%x1f%aI%x1e":
      "a1b2c3d\x1ffix sidebar\x1f2026-11-18T09:41:00Z\x1e" +
      "e4f5a6b\x1fadd tests\x1f2026-11-17T18:02:00Z\x1e",
  });
}

const REPO_ARGUMENTS = ["rev-parse", "--show-toplevel"];

describe("createSnapshotReader", () => {
  it("builds a snapshot with branch, main worktree state and commits in git order", async () => {
    const runner = cannedRunner();
    const snapshot = await createSnapshotReader("/repo", runner.run).read();

    expect(snapshot).toEqual({
      branch: "main",
      detachedHead: false,
      worktree: { isLinked: false, rootPath: "/repo", label: "repo" },
      commits: [
        { hash: "a1b2c3d", subject: "fix sidebar", date: "2026-11-18T09:41:00Z" },
        { hash: "e4f5a6b", subject: "add tests", date: "2026-11-17T18:02:00Z" },
      ],
    });
    expect(runner.calls[0]).toEqual(REPO_ARGUMENTS);
  });

  it("marks linked worktrees by comparing git dir with common dir", async () => {
    const runner = new FakeGitRunner({
      "rev-parse --show-toplevel": "/repo/worktrees/feature-x\n",
      "rev-parse --absolute-git-dir": "/repo/.git/worktrees/feature-x\n",
      "rev-parse --git-common-dir": ".git\n",
      "branch --show-current": "feature-x\n",
      "log -8 --pretty=format:%h%x1f%s%x1f%aI%x1e": "a1b2c3d\x1fwip\x1f2026-11-18T09:41:00Z\x1e",
    });

    const snapshot = await createSnapshotReader("/repo/worktrees/feature-x", runner.run).read();

    expect(snapshot?.worktree).toEqual({
      isLinked: true,
      rootPath: "/repo/worktrees/feature-x",
      label: "feature-x",
    });
  });

  it("returns null when the directory is not a git repository", async () => {
    const runner = cannedRunner();
    runner.failingCommand = "rev-parse --show-toplevel";

    const snapshot = await createSnapshotReader("/plain", runner.run).read();

    expect(snapshot).toBeNull();
  });

  it("keeps the branch visible when the repository has no commits yet", async () => {
    const runner = cannedRunner();
    runner.failingCommand = "log -8 --pretty=format:%h%x1f%s%x1f%aI%x1e";

    const snapshot = await createSnapshotReader("/repo", runner.run).read();

    expect(snapshot?.branch).toBe("main");
    expect(snapshot?.commits).toEqual([]);
  });

  it("falls back to detached head when no branch name is current", async () => {
    const runner = new FakeGitRunner({
      "rev-parse --show-toplevel": "/repo\n",
      "rev-parse --absolute-git-dir": "/repo/.git\n",
      "rev-parse --git-common-dir": ".git\n",
      "branch --show-current": "\n",
      "log -8 --pretty=format:%h%x1f%s%x1f%aI%x1e": "a1b2c3d\x1fwip\x1f2026-11-18T09:41:00Z\x1e",
    });

    const snapshot = await createSnapshotReader("/repo", runner.run).read();

    expect(snapshot?.branch).toBe("a1b2c3d");
    expect(snapshot?.detachedHead).toBe(true);
  });
});
