import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse } from "./utils/error-handler.js";

// Netlify Function: Wearables
// Connected-device status for the athlete, read from real device_pairings/
// monitoring_providers state (2026-07-23 — was a hardcoded catalogue until
// the Garmin/Oura/WHOOP OAuth framework and wearables-webhook.js gave
// device_pairings a real writer; see docs/gps_wearable_csv_import_proposal.md
// §2). Dispatched by the `data` domain router.
//   GET /api/wearables/status → device catalogue + real connection state

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "wearables",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (_evt, _ctx, { userId }) => {
      const { data: providers } = await supabaseAdmin
        .from("monitoring_providers")
        .select("id, key, display_name")
        .in("kind", ["wearable", "both"])
        .eq("is_active", true);

      const { data: pairings } = await supabaseAdmin
        .from("device_pairings")
        .select("provider_id, is_active, paired_at")
        .eq("user_id", userId);
      const pairingByProviderId = new Map(
        (pairings ?? []).map((p) => [p.provider_id, p]),
      );

      // Most recent reading per source — a bounded, ordered scan rather than
      // a GROUP BY (PostgREST has no aggregate select), capped to a window
      // large enough to find each connected provider's latest row without
      // scanning a long-connected athlete's entire wearable_health history.
      const { data: recentReadings } = await supabaseAdmin
        .from("wearable_health")
        .select("source, recorded_at")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(500);
      const lastSyncBySource = new Map();
      for (const reading of recentReadings ?? []) {
        if (!lastSyncBySource.has(reading.source)) {
          lastSyncBySource.set(reading.source, reading.recorded_at);
        }
      }

      const devices = (providers ?? []).map((provider) => {
        const pairing = pairingByProviderId.get(provider.id);
        return {
          id: provider.key,
          name: provider.display_name,
          connected: Boolean(pairing?.is_active),
          pairedAt: pairing?.paired_at ?? null,
          lastSync: lastSyncBySource.get(provider.key) ?? null,
        };
      });

      return createSuccessResponse({ devices });
    },
  });

export const testHandler = handler;
export { handler };
