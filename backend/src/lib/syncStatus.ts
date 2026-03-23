export type SyncStatus = "in_progress" | "complete" | "failed";

export type UserSyncState = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
};

const states = new Map<string, UserSyncState>();

export function getUserSyncState(userId: string): UserSyncState {
  return (
    states.get(userId) ?? {
      status: "complete",
      lastSyncedAt: null,
      errorMessage: null
    }
  );
}

export function setUserSyncState(params: {
  userId: string;
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}) {
  states.set(params.userId, {
    status: params.status,
    lastSyncedAt: params.lastSyncedAt,
    errorMessage: params.errorMessage
  });
}
