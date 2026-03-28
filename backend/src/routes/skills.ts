import { Router } from "express";
import { groupSkillHistoryByConcept } from "../lib/portfolioHelpers";
import { SKILL_TAXONOMY } from "../lib/skillTaxonomy";
import { listSkillScoreHistoryForUser, listSkillScoresByUser } from "../models/skillScores";

export const skillsRouter = Router();

skillsRouter.get("/history", async (req, res) => {
  try {
    const userId = req.user!.id;
    const rows = await listSkillScoreHistoryForUser(userId);
    const concepts = groupSkillHistoryByConcept(rows);
    return res.json({ concepts });
  } catch (e) {
    console.error("skills history failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

skillsRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const rows = await listSkillScoresByUser(userId);
  const byConcept = new Map(rows.map((row) => [row.concept, row.score]));

  const skills = SKILL_TAXONOMY.map((concept) => ({
    concept,
    score: byConcept.get(concept) ?? 50
  }));

  return res.json({ skills });
});
