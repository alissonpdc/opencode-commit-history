import { basename, resolve } from "node:path";
import type { WorktreeState } from "./types";

interface WorktreePaths {
  /** `git rev-parse --show-toplevel` */
  readonly rootPath: string;
  /** `git rev-parse --absolute-git-dir` (may still be relative in odd setups) */
  readonly gitDir: string;
  /** `git rev-parse --git-common-dir` */
  readonly commonDir: string;
}

/** A directory is a linked worktree when its git dir differs from the repository's common dir. */
export function resolveWorktree(paths: WorktreePaths): WorktreeState {
  const rootPath = resolve(paths.rootPath);
  const gitDir = resolve(rootPath, paths.gitDir);
  const commonDir = resolve(rootPath, paths.commonDir);
  return {
    isLinked: gitDir !== commonDir,
    rootPath,
    label: basename(rootPath),
  };
}
