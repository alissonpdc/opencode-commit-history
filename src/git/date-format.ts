const INVALID_DATE_TIME = NaN;

/** Compact sidebar timestamp, e.g. "18/11 12:41" (viewer's local time). */
export function formatCommitTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month} ${hours}:${minutes}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
