import { parseCommitLog } from "./log-parser";
import { resolveWorktree } from "./worktree-resolver";
import type { GitCommandRunner, GitSnapshot } from "./types";

export const SIDEBAR_COMMIT_LIMIT = 5;

const LOG_ARGUMENTS = ["log", `-${SIDEBAR_COMMIT_LIMIT}`, "--pretty=format:%h%x1f%s%x1f%aI%x1e"];

export interface SnapshotReader {
  /** Full repository state, or null when the directory is not inside a git work tree. */
  read(): Promise<GitSnapshot | null>;
}

export function createSnapshotReader(directory: string, runner: GitCommandRunner): SnapshotReader {
  const run = async (args: readonly string[]): Promise<string> => (await runner(args)).trim();
  return { read: () => readSnapshot(run) };
}

async function readSnapshot(run: (args: readonly string[]) => Promise<string>): Promise<GitSnapshot | null> {
  const rootPath = await tryRun(run, ["rev-parse", "--show-toplevel"]);
  if (rootPath === null) return null;
  const gitDir = await run(["rev-parse", "--absolute-git-dir"]);
  const commonDir = await run(["rev-parse", "--git-common-dir"]);
  const branch = await run(["branch", "--show-current"]);
  const status = await run(["status", "--porcelain"]);
  const commits = parseCommitLog((await tryRun(run, LOG_ARGUMENTS)) ?? "", SIDEBAR_COMMIT_LIMIT);
  return {
    branch: branch === "" ? (commits[0]?.hash ?? "") : branch,
    detachedHead: branch === "",
    dirty: status !== "",
    worktree: resolveWorktree({ rootPath, gitDir, commonDir }),
    commits,
  };
}

/** Maps expected git failures (not a repo, no commits yet) to null instead of throwing. */
async function tryRun(
  run: (args: readonly string[]) => Promise<string>,
  args: readonly string[],
): Promise<string | null> {
  try {
    return (await run(args)).trim();
  } catch {
    return null;
  }
}

export interface StatusReader {
  /** Cheap branch + dirty state for fast polling; null when git fails. */
  read(): Promise<{ branch: string; dirty: boolean } | null>;
}

export function createStatusReader(directory: string, runner: GitCommandRunner): StatusReader {
  const run = async (args: readonly string[]): Promise<string> => (await runner(args)).trim();
  return {
    read: async () => {
      const branch = await tryRun(run, ["branch", "--show-current"]);
      if (branch === null) return null;
      const status = await tryRun(run, ["status", "--porcelain"]);
      if (status === null) return null;
      return { branch, dirty: status !== "" };
    },
  };
}
