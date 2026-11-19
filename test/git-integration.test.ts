import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterAll, beforeAll, expect, it, describe } from "vitest";
import { createSnapshotReader } from "../src/git/snapshot";
import { createGitProcessRunner } from "../src/git/runner";

let sandboxRoot: string;

const git = (cwd: string, args: string[]) =>
  new Promise<string>((resolve, reject) =>
    execFile("git", args, { cwd }, (error, stdout, stderr) =>
      error ? reject(new Error(stderr)) : resolve(stdout.trim()),
    ),
  );

async function createSandboxRepository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "opencode-git-history-"));
  await git(root, ["init", "--initial-branch=main", "repo"]);
  const repo = join(root, "repo");
  await git(repo, ["config", "user.email", "test@example.com"]);
  await git(repo, ["config", "user.name", "Test"]);
  await git(repo, ["commit", "--allow-empty", "-m", "first commit"]);
  await git(repo, ["commit", "--allow-empty", "-m", "second commit"]);
  await git(repo, ["worktree", "add", join(root, "linked"), "-b", "feature/linked"]);
  return root;
}

beforeAll(async () => {
  sandboxRoot = await createSandboxRepository();
});

afterAll(async () => {
  await rm(sandboxRoot, { recursive: true, force: true });
});

describe("createSnapshotReader against real git", () => {
  it("reads branch, commits newest-first and main worktree state", async () => {
    const repo = join(sandboxRoot, "repo");

    const snapshot = await createSnapshotReader(repo, createGitProcessRunner(repo)).read();

    expect(snapshot?.branch).toBe("main");
    expect(snapshot?.detachedHead).toBe(false);
    expect(snapshot?.worktree.isLinked).toBe(false);
    expect(snapshot?.commits.map((commit) => commit.subject)).toEqual(["second commit", "first commit"]);
    expect(snapshot?.commits[0]?.hash).toBe(await git(repo, ["rev-parse", "--short", "HEAD"]));
  });

  it("marks a linked worktree directory and keeps its branch", async () => {
    const linked = join(sandboxRoot, "linked");

    const snapshot = await createSnapshotReader(linked, createGitProcessRunner(linked)).read();

    expect(snapshot?.branch).toBe("feature/linked");
    expect(snapshot?.worktree.isLinked).toBe(true);
    expect(snapshot?.worktree.label).toBe(basename(linked));
  });

  it("returns null outside a repository", async () => {
    const plain = await mkdtemp(join(tmpdir(), "opencode-plain-"));

    const snapshot = await createSnapshotReader(plain, createGitProcessRunner(plain)).read();

    expect(snapshot).toBeNull();
    await rm(plain, { recursive: true, force: true });
  });
});
