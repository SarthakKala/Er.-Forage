import { isSkillConcept } from "../lib/skillTaxonomy";

export type AnalysisResult = {
  concept_tags: string[];
  skill_gap: string;
  root_cause: string;
  post_solve_analysis: string;
  score_impact: number;
};

export const DEFAULT_ANALYSIS_RESULT: AnalysisResult = {
  concept_tags: [],
  skill_gap: "Unable to determine skill gap from model output.",
  root_cause: "Model output could not be parsed safely.",
  post_solve_analysis:
    "Your submission was recorded, but analysis failed due to malformed AI response. Try syncing again.",
  score_impact: 0
};

function parseJsonFromResponse(rawText: string): unknown {
  const trimmed = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("No JSON object found in model response");
  }
}

export function parseAnalysisResponse(rawText: string): AnalysisResult {
  try {
    const parsed = parseJsonFromResponse(rawText) as Partial<AnalysisResult>;
    const conceptTags = Array.isArray(parsed.concept_tags)
      ? parsed.concept_tags.filter((tag): tag is string => typeof tag === "string").filter(isSkillConcept)
      : [];

    return {
      concept_tags: conceptTags,
      skill_gap:
        typeof parsed.skill_gap === "string" && parsed.skill_gap.trim().length > 0
          ? parsed.skill_gap.trim()
          : DEFAULT_ANALYSIS_RESULT.skill_gap,
      root_cause:
        typeof parsed.root_cause === "string" && parsed.root_cause.trim().length > 0
          ? parsed.root_cause.trim()
          : DEFAULT_ANALYSIS_RESULT.root_cause,
      post_solve_analysis:
        typeof parsed.post_solve_analysis === "string" && parsed.post_solve_analysis.trim().length > 0
          ? parsed.post_solve_analysis.trim()
          : DEFAULT_ANALYSIS_RESULT.post_solve_analysis,
      score_impact:
        typeof parsed.score_impact === "number" && Number.isFinite(parsed.score_impact)
          ? Math.round(parsed.score_impact)
          : 0
    };
  } catch (error) {
    console.error("Failed to parse AI JSON response:", error);
    return DEFAULT_ANALYSIS_RESULT;
  }
}
