import { Router } from "express";
import { db } from "../lib/db";
import { isSkillConcept } from "../lib/skillTaxonomy";
import { insertSkillScoreHistory, upsertSkillScore } from "../models/skillScores";

export const onboardingRouter = Router();

type DiagnosticResultRow = {
  concept: string;
  result: "accepted" | "wrong" | "tle" | "error";
};

onboardingRouter.post("/diagnostic", async (req, res) => {
  try {
    const userId = req.user!.id;
    const results = req.body?.results as DiagnosticResultRow[] | undefined;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: "results must be a non-empty array" });
    }

    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM submissions WHERE user_id = $1`,
      [userId]
    );
    const submissionCount = Number(countRes.rows[0]?.count ?? 0);
    if (submissionCount > 0) {
      return res.status(400).json({
        message: "Diagnostic profile is only for users with no submission history"
      });
    }

    const aggregates = new Map<string, { wins: number; total: number }>();

    for (const row of results) {
      if (!row || typeof row.concept !== "string" || typeof row.result !== "string") {
        return res.status(400).json({ message: "Each item needs concept and result" });
      }
      if (!isSkillConcept(row.concept)) {
        return res.status(400).json({ message: `Invalid concept: ${row.concept}` });
      }
      const r = row.result;
      if (r !== "accepted" && r !== "wrong" && r !== "tle" && r !== "error") {
        return res.status(400).json({ message: `Invalid result: ${row.result}` });
      }

      const agg = aggregates.get(row.concept) ?? { wins: 0, total: 0 };
      agg.total += 1;
      if (r === "accepted") {
        agg.wins += 1;
      }
      aggregates.set(row.concept, agg);
    }

    const updated: Array<{ concept: string; score: number }> = [];

    for (const [concept, agg] of aggregates) {
      const score = agg.total > 0 ? Math.round((agg.wins / agg.total) * 100) : 0;
      await upsertSkillScore({ userId, concept, score });
      await insertSkillScoreHistory({ userId, concept, score });
      updated.push({ concept, score });
    }

    return res.status(200).json({ profile: updated });
  } catch (e) {
    console.error("onboarding diagnostic failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});
