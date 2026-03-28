import { Router } from "express";
import { getGrowthReportByToken } from "../models/growthReports";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const publicReportRouter = Router();

publicReportRouter.get("/report/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!UUID_RE.test(token)) {
      return res.status(404).json({ message: "Report not found" });
    }

    const row = await getGrowthReportByToken(token);
    if (!row) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json({
      snapshot_data: row.snapshot_data,
      created_at: row.created_at
    });
  } catch (e) {
    console.error("public report load failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});
