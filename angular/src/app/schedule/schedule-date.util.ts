/**
 * Schedule date helpers — local-time <-> ISO conversion for the athlete's
 * calendar, plus the human span label.
 *
 * Pure (no DI, no signals) so they can be unit-tested without a TestBed. The
 * athlete picks dates in their own timezone; the API stores ISO, so every
 * conversion here is deliberately local-time, not UTC.
 */

/**
 * Combine a `YYYY-MM-DD` date and an `HH:mm` time into an ISO string,
 * interpreting both in the athlete's local timezone.
 */
export function combineLocal(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString();
}

/** ISO -> the `YYYY-MM-DD` an `<input type="date">` expects, in local time. */
export function toDateInput(iso: string): string {
  const dt = new Date(iso);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO -> the `HH:mm` an `<input type="time">` expects, in local time. */
export function toTimeInput(iso: string): string {
  const dt = new Date(iso);
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

/**
 * Human label for an event's span: a date range when it genuinely spans more
 * than one day (camps, multi-day tournaments), otherwise date + kickoff time.
 */
export function whenLabel(startsAt: string, endsAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  const time = new Date(startsAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (endsAt && fmt(endsAt) !== fmt(startsAt)) {
    return `${fmt(startsAt)} → ${fmt(endsAt)}`;
  }
  return `${fmt(startsAt)} · ${time}`;
}
