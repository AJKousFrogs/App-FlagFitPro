import { describe, expect, it } from "vitest";
import { getTeamInvitationRpcError } from "./team-invitation-rpc.utils";

describe("getTeamInvitationRpcError", () => {
  it("returns the transport error when Supabase rpc fails", () => {
    const error = { message: "permission denied", code: "42501" };

    expect(
      getTeamInvitationRpcError(
        { success: true },
        error,
        "Fallback invitation error",
      ),
    ).toBe(error);
  });

  it("turns an rpc failure payload into an error object", () => {
    expect(
      getTeamInvitationRpcError(
        { success: false, error: "Invalid or expired invitation" },
        null,
        "Fallback invitation error",
      ),
    ).toEqual({ message: "Invalid or expired invitation" });
  });

  it("uses the fallback message when the rpc payload has no explicit error", () => {
    expect(
      getTeamInvitationRpcError(
        { success: false },
        null,
        "Fallback invitation error",
      ),
    ).toEqual({ message: "Fallback invitation error" });
  });

  it("returns null for successful rpc payloads", () => {
    expect(
      getTeamInvitationRpcError(
        { success: true, team_id: "team-1" },
        null,
        "Fallback invitation error",
      ),
    ).toBeNull();
  });
});
