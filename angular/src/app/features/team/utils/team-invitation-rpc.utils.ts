export interface TeamInvitationRpcResponse {
  success?: boolean;
  error?: string | null;
  team_id?: string;
  role?: string | null;
}

export interface TeamInvitationRpcError {
  code?: string;
  message?: string;
}

export function getTeamInvitationRpcError(
  data: unknown,
  error: TeamInvitationRpcError | null,
  fallbackMessage: string,
): TeamInvitationRpcError | null {
  if (error) {
    return error;
  }

  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    (data as TeamInvitationRpcResponse).success === false
  ) {
    const rpcError = (data as TeamInvitationRpcResponse).error;
    return {
      message:
        typeof rpcError === "string" && rpcError.trim().length > 0
          ? rpcError
          : fallbackMessage,
    };
  }

  return null;
}
