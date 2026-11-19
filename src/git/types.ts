/** One commit as shown in the sidebar, in git's most-recent-first order. */
export interface CommitRecord {
  readonly hash: string;
  readonly subject: string;
  /** Author date in ISO-8601, as emitted by git's %aI. */
  readonly date: string;
}

/** Where the TUI is running relative to the repository. */
export interface WorktreeState {
  /** True when the directory is a linked worktree, false for the main working tree. */
  readonly isLinked: boolean;
  /** Absolute path of the working tree root (`git rev-parse --show-toplevel`). */
  readonly rootPath: string;
  /** Short display name: basename of the working tree root. */
  readonly label: string;
}

/** Everything the sidebar needs about the repository at the session location. */
export interface GitSnapshot {
  /** Current branch name; empty when HEAD is detached. */
  readonly branch: string;
  readonly detachedHead: boolean;
  /** True when `git status --porcelain` reports uncommitted changes. */
  readonly dirty: boolean;
  readonly worktree: WorktreeState;
  readonly commits: readonly CommitRecord[];
}

/** Runs one git command in the plugin's directory and returns stdout. Thin seam for tests. */
export type GitCommandRunner = (args: readonly string[]) => Promise<string>;

