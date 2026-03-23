import { Router } from "express";
import { decryptString } from "../lib/tokenEncryption";
import { setUserSyncState, getUserSyncState } from "../lib/syncStatus";
import { fetchLeetCodeSubmissionHistory } from "../adapters/leetcode";
import {
  getPlatformConnectionByPlatform
} from "../models/platformConnections";
import { insertSubmissions } from "../models/submissions";

export const syncRouter = Router();

syncRouter.post("/", async (req, res) => {
  const userId = req.user!.id;
  setUserSyncState({
    userId,
    status: "in_progress",
    lastSyncedAt: null,
    errorMessage: null
  });

  try {
    const connection = await getPlatformConnectionByPlatform({
      userId,
      platform: "leetcode"
    });

    if (!connection) {
      const message = "No LeetCode connection found";
      setUserSyncState({
        userId,
        status: "failed",
        lastSyncedAt: null,
        errorMessage: message
      });
      return res.status(400).json({ message });
    }

    if (!connection.leetcode_session || !connection.csrf_token) {
      const message = "LeetCode session/csrf_token missing for this user";
      setUserSyncState({
        userId,
        status: "failed",
        lastSyncedAt: null,
        errorMessage: message
      });
      return res.status(400).json({ message });
    }

    const decryptedSessionToken = decryptString(connection.leetcode_session);
    const decryptedCsrfToken = decryptString(connection.csrf_token);

    const historyResult = await fetchLeetCodeSubmissionHistory({
      sessionToken: decryptedSessionToken,
      csrfToken: decryptedCsrfToken,
      pageSize: 50,
      maxSubmissions: 500
    });

    if (!historyResult.ok) {
      const message = historyResult.error.message;
      setUserSyncState({
        userId,
        status: "failed",
        lastSyncedAt: null,
        errorMessage: message
      });
      return res.status(502).json({
        message: "Failed to sync LeetCode submissions",
        error: historyResult.error
      });
    }

    const { insertedCount, totalAttempted } = await insertSubmissions({
      userId,
      submissions: historyResult.data
    });

    const nowIso = new Date().toISOString();
    setUserSyncState({
      userId,
      status: "complete",
      lastSyncedAt: nowIso,
      errorMessage: null
    });

    return res.status(200).json({
      status: "complete",
      insertedCount,
      totalAttempted,
      lastSyncedAt: nowIso
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown sync error";
    setUserSyncState({
      userId,
      status: "failed",
      lastSyncedAt: null,
      errorMessage: message
    });
    return res.status(500).json({ message: "Sync failed", error: message });
  }
});

syncRouter.get("/status", async (req, res) => {
  const userId = req.user!.id;
  const state = getUserSyncState(userId);
  return res.json(state);
});

