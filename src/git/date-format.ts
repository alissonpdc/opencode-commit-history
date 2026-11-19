const formatterCache = new Map<string, Intl.DateTimeFormat | null>();

function getTimeFormatter(timeZone?: string): Intl.DateTimeFormat | null {
  if (timeZone === undefined) return null;
  if (!formatterCache.has(timeZone)) {
    let formatter: Intl.DateTimeFormat | null = null;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
    } catch {
      formatter = null;
    }
    formatterCache.set(timeZone, formatter);
  }
  return formatterCache.get(timeZone) ?? null;
}

function localFormat(date: Date): string {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month} ${hours}:${minutes}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Compact sidebar timestamp, e.g. "18/11 12:41". With an IANA timeZone the
 * instant is converted to it; without, the process-local time is shown.
 */
export function formatCommitTime(isoDate: string, timeZone?: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const formatter = getTimeFormatter(timeZone);
  if (formatter === null) return localFormat(date);
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")}/${value("month")} ${value("hour")}:${value("minute")}`;
}
