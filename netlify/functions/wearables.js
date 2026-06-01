import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse } from "./utils/error-handler.js";

// Netlify Function: Wearables
// Connected-device status for the athlete. Placeholder catalogue until real device sync
// (Garmin / Polar / WHOOP / Catapult) lands — once connected, their objective load will
// feed the same training_sessions → ACWR pipeline. Dispatched by the `data` domain router.
//   GET /api/wearables/status → device catalogue + connection state
const DEVICES = [
  { id: "garmin", name: "Garmin", connected: false, lastSync: null },
  { id: "polar", name: "Polar", connected: false, lastSync: null },
  { id: "whoop", name: "WHOOP", connected: false, lastSync: null },
  { id: "catapult", name: "Catapult", connected: false, lastSync: null },
];

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "wearables",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async () => createSuccessResponse({ devices: DEVICES }),
  });

export const testHandler = handler;
export { handler };
