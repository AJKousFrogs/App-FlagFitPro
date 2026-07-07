import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Bloodwork / Labs
// Endpoint: /api/bloodwork
//
// GET ?athleteId= → panels + their markers for the caller, OR for a teammate when
//   RLS lets the viewer through (medical lane: same-team physiotherapist/admin/
//   owner). Bloodwork is the most sensitive layer — no coach/consent path, only
//   the medical lane, enforced by RLS. Defaults to self.
// POST → create the caller's own panel (+ optional markers).
//
// Access is enforced by RLS (bloodwork_panels/bloodwork_markers policies) through
// the request-scoped `supabase` client; this endpoint holds no role logic.

const NUM = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);

function markerToApi(m) {
  return {
    id: m.id,
    markerName: m.marker_name,
    value: m.value,
    unit: m.unit,
    referenceLow: m.reference_low,
    referenceHigh: m.reference_high,
    flag: m.flag,
  };
}

function panelToApi(p, markers) {
  return {
    id: p.id,
    collectedDate: p.collected_date,
    panelType: p.panel_type,
    labName: p.lab_name,
    orderedBy: p.ordered_by,
    notes: p.notes,
    markers: markers.filter((m) => m.panel_id === p.id).map(markerToApi),
  };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "bloodwork",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      try {
        if (evt.httpMethod === "GET") {
          const athleteId = evt.queryStringParameters?.athleteId || userId;
          const { data: panels, error: pErr } = await supabase
            .from("bloodwork_panels")
            .select("*")
            .eq("user_id", athleteId)
            .order("collected_date", { ascending: false })
            .limit(50);
          if (pErr) {
            throw pErr;
          }
          const panelIds = (panels ?? []).map((p) => p.id);
          let markers = [];
          if (panelIds.length) {
            const { data: mData, error: mErr } = await supabase
              .from("bloodwork_markers")
              .select("*")
              .in("panel_id", panelIds);
            if (mErr) {
              throw mErr;
            }
            markers = mData ?? [];
          }
          return createSuccessResponse({
            panels: (panels ?? []).map((p) => panelToApi(p, markers)),
          });
        }

        let body;
        const parsedBody = tryParseJsonObjectBody(evt.body);
        if (!parsedBody.ok) {
          return parsedBody.error;
        }
        body = parsedBody.data;
        const collectedDate = body.collectedDate ?? body.collected_date;
        if (!collectedDate) {
          return createErrorResponse(
            "collectedDate is required",
            422,
            "validation_error",
          );
        }
        const { data: panel, error: pErr } = await supabase
          .from("bloodwork_panels")
          .insert({
            user_id: userId,
            collected_date: collectedDate,
            panel_type: body.panelType
              ? String(body.panelType).slice(0, 80)
              : null,
            lab_name: body.labName ? String(body.labName).slice(0, 120) : null,
            ordered_by: body.orderedBy
              ? String(body.orderedBy).slice(0, 120)
              : null,
            notes: body.notes ? String(body.notes).slice(0, 500) : null,
          })
          .select()
          .single();
        if (pErr) {
          throw pErr;
        }

        const markersIn = Array.isArray(body.markers) ? body.markers : [];
        let markers = [];
        if (markersIn.length) {
          const rows = markersIn
            .filter((m) => m && m.markerName)
            .slice(0, 100)
            .map((m) => ({
              panel_id: panel.id,
              marker_name: String(m.markerName).slice(0, 80),
              value: NUM(m.value),
              unit: m.unit ? String(m.unit).slice(0, 20) : null,
              reference_low: NUM(m.referenceLow),
              reference_high: NUM(m.referenceHigh),
              flag: m.flag ? String(m.flag).slice(0, 20) : null,
            }));
          if (rows.length) {
            const { data: mData, error: mErr } = await supabase
              .from("bloodwork_markers")
              .insert(rows)
              .select();
            if (mErr) {
              throw mErr;
            }
            markers = mData ?? [];
          }
        }
        return createSuccessResponse(
          panelToApi(panel, markers),
          201,
          "Bloodwork panel saved",
        );
      } catch (_error) {
        return createErrorResponse(
          "Failed to process bloodwork",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
