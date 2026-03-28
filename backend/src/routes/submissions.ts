import { Router } from "express";
import { leetTitleToSlug } from "../lib/leetcodeSlug";
import { insertManualPasteSubmission, listSubmissions, type SubmissionRow } from "../models/submissions";
import { runAIAnalysisOnSingleSubmission } from "../services/analysis";

export const submissionsRouter = Router();

function parsePasteResult(value: unknown): SubmissionRow["result"] | null {
  if (typeof value !== "string") return null;
  const v = value.toLowerCase().trim();
  if (v === "accepted" || v === "ac") return "accepted";
  if (v === "wrong" || v === "wa") return "wrong";
  if (v === "tle" || v.includes("time")) return "tle";
  if (v === "error" || v === "re") return "error";
  return null;
}

function parsePasteDifficulty(value: unknown): SubmissionRow["difficulty"] | null {
  if (typeof value !== "string") return null;
  const v = value.toLowerCase().trim();
  if (v === "easy") return "easy";
  if (v === "medium") return "medium";
  if (v === "hard") return "hard";
  return null;
}

submissionsRouter.post("/paste", async (req, res) => {
  try {
    const userId = req.user!.id;
    const problemTitle = req.body?.problemTitle;
    const code = req.body?.code;

    if (typeof problemTitle !== "string" || problemTitle.trim().length === 0) {
      return res.status(400).json({ message: "problemTitle is required" });
    }
    if (typeof code !== "string") {
      return res.status(400).json({ message: "code is required" });
    }

    const result = parsePasteResult(req.body?.result);
    if (!result) {
      return res.status(400).json({ message: "result must be accepted, wrong, tle, or error" });
    }

    const difficulty = parsePasteDifficulty(req.body?.difficulty);
    if (!difficulty) {
      return res.status(400).json({ message: "difficulty must be easy, medium, or hard" });
    }

    const problemId = leetTitleToSlug(problemTitle);

    const submission = await insertManualPasteSubmission({
      userId,
      problemId,
      problemTitle: problemTitle.trim(),
      code,
      result,
      difficulty
    });

    const ai = await runAIAnalysisOnSingleSubmission({ userId, submission });

    return res.status(201).json({
      submissionId: submission.id,
      analysis: ai.analysis,
      aiOk: ai.aiOk,
      aiErrorMessage: ai.aiErrorMessage
    });
  } catch (e) {
    console.error("submissions paste failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

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
    console.error("submissions list failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

