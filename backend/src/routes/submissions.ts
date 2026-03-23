import { Router } from "express";
import { listSubmissions } from "../models/submissions";

export const submissionsRouter = Router();

submissionsRouter.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);

    const result = await listSubmissions({
      userId,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 20
    });

    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: "Failed to list submissions", details: e });
  }
});

