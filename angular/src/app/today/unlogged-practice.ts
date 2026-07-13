/**
 * Detect a recent team-practice day (today or yesterday) with NO logged training
 * session — the trigger for the "log your practice" nudge on Today.
 *
 * This is the honest way to close the "practices don't feed ACWR" gap: rather
 * than fabricate an estimated practice load (which the engine forbids), we nudge
 * the athlete to log the ACTUAL session so its real RPE × minutes flows into
 * ACWR. Pure + time-injected so it's unit-testable.
 *
 * @param trainingDays venue-local practice date strings ("YYYY-MM-DD") from the
 *   schedule snapshot; null/empty → no nudge.
 * @param loggedAt completion timestamps of recently-logged sessions.
 * @param now the current time.
 */
export function resolveUnloggedPractice(
  trainingDays: readonly string[] | null | undefined,
  loggedAt: readonly (string | Date)[],
  now: Date,
): { label: string } | null {
  if (!trainingDays || trainingDays.length === 0) return null;
  const localIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayIso = localIso(today);
  const yesterdayIso = localIso(new Date(today.getTime() - 86_400_000));
  const logged = new Set(loggedAt.map((t) => localIso(new Date(t))));
  const candidate = trainingDays
    .filter((d) => (d === todayIso || d === yesterdayIso) && !logged.has(d))
    .slice()
    .sort()
    .reverse()[0];
  if (!candidate) return null;
  return { label: candidate === todayIso ? "today's" : "yesterday's" };
}
