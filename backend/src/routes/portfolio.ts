import { Router } from "express";
import { env } from "../config/env";
import {
  deleteGrowthReportById,
  deleteGrowthReportByToken,
  insertGrowthReport,
  listGrowthReportsByUser,
  renameGrowthReportById,
  renameGrowthReportByToken
} from "../models/growthReports";
import { buildFullPortfolioResponse, buildGrowthSnapshotData } from "../services/portfolioSnapshot";

export const portfolioRouter = Router();

portfolioRouter.post("/report", async (req, res) => {
  try {
    const userId = req.user!.id;
    const snapshotData = await buildGrowthSnapshotData(userId);
    const row = await insertGrowthReport({
      userId,
      snapshotData: snapshotData as unknown as Record<string, unknown>
    });

    const publicUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/report/${row.token}`;

    return res.status(201).json({
      report: {
        id: row.id,
        token: row.token,
        created_at: row.created_at,
        period: row.period,
        snapshot_data: row.snapshot_data,
        publicUrl
      }
    });
  } catch (e) {
    console.error("portfolio/report failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

portfolioRouter.get("/reports", async (req, res) => {
  try {
    const reports = await listGrowthReportsByUser(req.user!.id);
    return res.json({ reports });
  } catch (e) {
    console.error("portfolio/reports list failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

portfolioRouter.patch("/reports/:id", async (req, res) => {
  try {
    const reportName = String(req.body?.reportName ?? "").trim();
    if (!reportName) {
      return res.status(400).json({ message: "reportName is required" });
    }
    let row = await renameGrowthReportById({
      userId: req.user!.id,
      reportId: req.params.id,
      reportName
    });
    if (!row) {
      row = await renameGrowthReportByToken({
        userId: req.user!.id,
        token: req.params.id,
        reportName
      });
    }
    if (!row) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.json({ report: row });
  } catch (e) {
    console.error("portfolio/reports rename failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

portfolioRouter.delete("/reports/:id", async (req, res) => {
  try {
    let ok = await deleteGrowthReportById({
      userId: req.user!.id,
      reportId: req.params.id
    });
    if (!ok) {
      ok = await deleteGrowthReportByToken({
        userId: req.user!.id,
        token: req.params.id
      });
    }
    if (!ok) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.json({ message: "Report deleted" });
  } catch (e) {
    console.error("portfolio/reports delete failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

portfolioRouter.get("/", async (req, res) => {
  try {
    const portfolio = await buildFullPortfolioResponse(req.user!.id);
    return res.json(portfolio);
  } catch (e) {
    console.error("portfolio load failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});