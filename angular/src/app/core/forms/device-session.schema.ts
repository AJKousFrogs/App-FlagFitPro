/**
 * Device-session log — Signal Forms schema (2026-07-18).
 *
 * First Signal Forms migration. Lives in `core/forms/` (NOT `core/schemas/`,
 * which is runtime API-response validation — different concern, confusingly
 * similar name).
 *
 * The point of moving this here: the rule that matters — "never write an
 * all-null row" — used to be an imperative `canSave` computed in the
 * component, enforced only by a disabled button. It is now a declared
 * validator on the model itself, so it holds wherever the form is used and is
 * testable without mounting a component.
 */

import { schema, required, min, validate } from "@angular/forms/signals";

export interface DeviceSessionForm {
  sessionDate: string;
  deviceName: string;
  durationMinutes: number | null;
  totalDistanceM: number | null;
  highSpeedDistanceM: number | null;
  maxVelocityKmh: number | null;
  playerLoad: number | null;
  notes: string;
}

/**
 * The fields that count as "a real metric". `deviceName`/`notes` deliberately
 * do NOT — a row with a device name and nothing else is still an empty row.
 */
export const DEVICE_SESSION_METRIC_KEYS = [
  "durationMinutes",
  "totalDistanceM",
  "highSpeedDistanceM",
  "maxVelocityKmh",
  "playerLoad",
] as const satisfies readonly (keyof DeviceSessionForm)[];

export function emptyDeviceSession(sessionDate: string): DeviceSessionForm {
  return {
    sessionDate,
    deviceName: "",
    durationMinutes: null,
    totalDistanceM: null,
    highSpeedDistanceM: null,
    maxVelocityKmh: null,
    playerLoad: null,
    notes: "",
  };
}

/** True when at least one numeric metric carries a real, positive value. */
export function hasRealMetric(value: DeviceSessionForm): boolean {
  return DEVICE_SESSION_METRIC_KEYS.some((key) => {
    const n = value[key];
    return typeof n === "number" && n > 0;
  });
}

export const deviceSessionSchema = schema<DeviceSessionForm>((path) => {
  required(path.sessionDate, {
    message: "Pick the date this session happened.",
  });

  // Negative distance/duration is physically meaningless and would corrupt the
  // objective-load feed into ACWR.
  //
  // These used to be `min="0"` attributes in the template. Signal Forms REJECTS
  // that at compile time (NG8022: "Setting the 'min' attribute is not allowed
  // on nodes using the '[formField]' directive") because the directive projects
  // the schema's constraints onto the DOM itself — so declaring the bound here
  // is what puts `min="0"` back on the rendered input. One source, not two, and
  // unlike the old attribute this also holds against a programmatic set.
  for (const key of DEVICE_SESSION_METRIC_KEYS) {
    min(path[key], 0, { message: "Metrics can't be negative." });
  }

  // Tree validator — this rule is about the row as a whole rather than any one
  // field, so it belongs on the root path.
  //
  // Law #7 / anti-fabrication: an all-null row would enter the objective-load
  // history as a session that carries no load. Previously enforced ONLY by a
  // disabled button, which is a UI affordance rather than a rule.
  validate(path, ({ value }) =>
    hasRealMetric(value())
      ? null
      : {
          kind: "noMetrics",
          message:
            "Add at least one metric — distance, duration, top speed or player load.",
        },
  );
});
