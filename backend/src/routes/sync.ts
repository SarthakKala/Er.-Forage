import { Router } from "express";
import rateLimit from "express-rate-limit";
import { decryptString } from "../lib/tokenEncryption";
import { setUserSyncState, getUserSyncState } from "../lib/syncStatus";
import { fetchLeetCodeSubmissionHistory } from "../adapters/leetcode";
import {
  getPlatformConnectionByPlatform
} from "../models/platformConnections";
import { autoCompletePendingAssignmentsByProblemIds } from "../models/assignments";
import { insertSubmissions } from "../models/submissions";
import { runSubmissionAnalysisForUser } from "../services/analysis";
import { maybeGenerateWeeklyAssignments } from "../services/assignment";

export const syncRouter = Router();

const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1,
  message: { error: "Please wait 5 minutes between syncs" },
  keyGenerator: (req) => req.user!.id
});

syncRouter.post("/", syncLimiter, async (req, res) => {
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

    const { insertedCount, totalAttempted, insertedForSync } = await insertSubmissions({
      userId,
      submissions: historyResult.data
    });

    const analysisResult = await runSubmissionAnalysisForUser(userId);

    const newlyAcceptedProblemIds = insertedForSync
      .filter((row) => row.result === "accepted")
      .map((row) => row.problem_id);
    await autoCompletePendingAssignmentsByProblemIds({
      userId,
      acceptedProblemIds: newlyAcceptedProblemIds
    });

    const assignmentResult = await maybeGenerateWeeklyAssignments(userId);

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
      analysedCount: analysisResult.analysedCount,
      analysisFailedCount: analysisResult.failedCount,
      analysisLastError: analysisResult.lastError,
      assignmentsCreated: assignmentResult.created,
      lastSyncedAt: nowIso
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown sync error";
    console.error("sync failed:", e);
    setUserSyncState({
      userId,
      status: "failed",
      lastSyncedAt: null,
      errorMessage: message
    });
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

syncRouter.get("/status", async (req, res) => {
  const userId = req.user!.id;
  const state = getUserSyncState(userId);
  return res.json(state);
});

