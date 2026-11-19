const ELLIPSIS = "…";

/** Fits a commit subject on one sidebar line: `content…` within maxWidth. */
export function truncateSubject(subject: string, maxWidth: number): string {
  if (subject.length <= maxWidth) return subject;
  const keep = Math.max(maxWidth - ELLIPSIS.length, 0);
  return subject.slice(0, keep) + ELLIPSIS;
}
