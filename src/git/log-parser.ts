import type { CommitRecord } from "./types";

const FIELD = "\x1f";
const RECORD = "\x1e";

/** Parses `git log --pretty=format:%h%x1f%s%x1f%aI%x1e` output; git already returns newest first. */
export function parseCommitLog(output: string, limit: number): CommitRecord[] {
  const commits: CommitRecord[] = [];
  for (const record of output.split(RECORD)) {
    const [hash = "", subject = "", date = ""] = record.split(FIELD).map((field) => field.trim());
    if (hash === "" || subject === "" || date === "") continue;
    commits.push({ hash, subject, date });
    if (commits.length === limit) break;
  }
  return commits;
}
