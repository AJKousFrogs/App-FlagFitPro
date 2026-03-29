import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse } from "./utils/error-handler.js";

const DEFAULT_DEVICES = [
  { id: "garmin", name: "Garmin", connected: false, lastSync: null },
  { id: "polar", name: "Polar", connected: false, lastSync: null },
  { id: "whoop", name: "WHOOP", connected: false, lastSync: null },
  { id: "catapult", name: "Catapult", connected: false, lastSync: null },
];

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "wearables-status",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async () => createSuccessResponse({ devices: DEFAULT_DEVICES }),
  });

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
