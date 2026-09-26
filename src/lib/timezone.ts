/**
 * Timezone helpers built on Intl — no external dependencies.
 *
 * Bookings are stored as UTC instants, but all slot calculation and email
 * formatting must happen in the business's own timezone (Vercel runs in UTC,
 * so server-local Date math is wrong for e.g. Asia/Manila).
 */

export const DEFAULT_TIMEZONE = "UTC";

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(timeZone: string | null | undefined): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const values: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour === 24 ? 0 : values.hour,
    minute: values.minute,
    second: values.second,
  };
}

/** Difference (ms) between the zone's wall clock and UTC at the given instant. */
export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const p = getParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, date.getMilliseconds());
  return asUtc - date.getTime();
}

/** Convert a wall-clock time in `timeZone` to the corresponding UTC instant. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let offset = getTimeZoneOffsetMs(new Date(naiveUtc), timeZone);
  let timestamp = naiveUtc - offset;
  offset = getTimeZoneOffsetMs(new Date(timestamp), timeZone);
  timestamp = naiveUtc - offset;
  return new Date(timestamp);
}

/** Minutes since midnight in the given timezone. */
export function getZonedMinutes(date: Date, timeZone: string): number {
  const p = getParts(date, timeZone);
  return p.hour * 60 + p.minute;
}

/** "yyyy-mm-dd" calendar date in the given timezone. */
export function getZonedDateKey(date: Date, timeZone: string): string {
  const p = getParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * Returns [start, end) UTC instants covering the local calendar day
 * `dateKey` (yyyy-mm-dd) in `timeZone`. DST-safe.
 */
export function getZonedDayRange(dateKey: string, timeZone: string): { start: Date; end: Date } {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Invalid date");
  return {
    start: zonedTimeToUtc(year, month, day, 0, 0, timeZone),
    end: zonedTimeToUtc(year, month, day + 1, 0, 0, timeZone),
  };
}

export function formatZonedDate(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" }
): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(date);
}

export function formatZonedTime(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { timeStyle: "short" }
): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(date);
}
