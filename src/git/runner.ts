import { execFile } from "node:child_process";
import type { GitCommandRunner } from "./types";

const GIT_TIMEOUT_MS = 5000;
const GIT_MAX_BUFFER_BYTES = 1024 * 1024;

/** Runs git as a subprocess in the session directory. Fails when git is missing or the command fails. */
export function createGitProcessRunner(directory: string): GitCommandRunner {
  return async (args) => {
    const command = ["git", ...args];
    return new Promise<string>((resolveOutput, rejectCommand) => {
      execFile(
        command[0] ?? "git",
        command.slice(1),
        {
          cwd: directory,
          timeout: GIT_TIMEOUT_MS,
          maxBuffer: GIT_MAX_BUFFER_BYTES,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (error !== null) {
            rejectCommand(new Error(`git ${args.join(" ")} failed: ${stderr.trim() || error.message}`));
            return;
          }
          resolveOutput(stdout);
        },
      );
    });
  };
}
