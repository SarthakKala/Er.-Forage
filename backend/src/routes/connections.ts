import { Router } from "express";
import { encryptString } from "../lib/tokenEncryption";
import {
  disconnectPlatformConnection,
  listPlatformConnections,
  upsertPlatformConnection
} from "../models/platformConnections";

export const connectionsRouter = Router();

connectionsRouter.post("/", async (req, res) => {
  try {
    const { platform, sessionToken, csrfToken } = req.body as {
      platform?: "leetcode" | "codeforces";
      sessionToken?: string;
      csrfToken?: string;
    };

    if (platform !== "leetcode") {
      return res.status(400).json({ message: "platform must be 'leetcode'" });
    }
    if (!sessionToken || typeof sessionToken !== "string") {
      return res.status(400).json({ message: "Missing required field: sessionToken" });
    }
    if (!csrfToken || typeof csrfToken !== "string") {
      return res.status(400).json({ message: "Missing required field: csrfToken" });
    }

    // Encrypt before storing in Supabase (never store raw cookies).
    const encryptedSession = encryptString(sessionToken);
    const encryptedCsrf = encryptString(csrfToken);

    const result = await upsertPlatformConnection({
      userId: req.user!.id,
      platform: "leetcode",
      leetcodeSessionEncrypted: encryptedSession,
      csrfTokenEncrypted: encryptedCsrf
    });

    return res.status(201).json({ connection: result });
  } catch (e) {
    console.error("connections post failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

connectionsRouter.get("/", async (req, res) => {
  try {
    const connections = await listPlatformConnections(req.user!.id);
    return res.json({ connections });
  } catch (e) {
    console.error("connections list failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

connectionsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await disconnectPlatformConnection({ userId: req.user!.id, connectionId: id });
    if (!ok) {
      return res.status(404).json({ message: "Connection not found" });
    }
    return res.json({ message: "Disconnected" });
  } catch (e) {
    console.error("connections delete failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

