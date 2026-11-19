import { describe, expect, it } from "vitest";
import { resolveWorktree } from "../src/git/worktree-resolver";

describe("resolveWorktree", () => {
  it("reports the main working tree when git dir equals the common dir", () => {
    const worktree = resolveWorktree({
      rootPath: "/repo",
      gitDir: "/repo/.git",
      commonDir: "/repo/.git",
    });

    expect(worktree).toEqual({ isLinked: false, rootPath: "/repo", label: "repo" });
  });

  it("reports a linked worktree when the git dir lives under worktrees/", () => {
    const worktree = resolveWorktree({
      rootPath: "/repo/worktrees/feature-x",
      gitDir: "/repo/.git/worktrees/feature-x",
      commonDir: "/repo/.git",
    });

    expect(worktree).toEqual({
      isLinked: true,
      rootPath: "/repo/worktrees/feature-x",
      label: "feature-x",
    });
  });

  it("resolves relative git dir paths against the working tree root", () => {
    const worktree = resolveWorktree({
      rootPath: "/repo",
      gitDir: ".git",
      commonDir: ".git",
    });

    expect(worktree).toEqual({ isLinked: false, rootPath: "/repo", label: "repo" });
  });
});
