import { buildAnalysisPrompt } from "../ai/promptBuilder";
import { parseAnalysisResponse, type AnalysisResult } from "../ai/responseParser";
import { generateOpenRouterText } from "../lib/openrouter";
import { SKILL_TAXONOMY, isSkillConcept } from "../lib/skillTaxonomy";
import { insertSkillScoreHistory, upsertSkillScore } from "../models/skillScores";
import {
  listSubmissionsByConcept,
  listUnanalysedSubmissionsForUser,
  updateSubmissionAnalysis,
  type SubmissionRow
} from "../models/submissions";

type ScoredSubmission = {
  submitted_at: string;
  result: "accepted" | "wrong" | "tle" | "error";
};

const ANALYSIS_BATCH_SIZE_PER_SYNC = 5;
const AI_CALL_DELAY_MS = 15000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function calculateSkillScore(submissions: ScoredSubmission[]): number {
  if (submissions.length === 0) return 50;

  const now = Date.now();
  const halfLifeDays = 30;
  const lambda = Math.log(2) / halfLifeDays;

  let weightedSum = 0;
  let totalWeight = 0;

  submissions.forEach((sub) => {
    const ageInDays = (now - new Date(sub.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-lambda * ageInDays);
    const value = sub.result === "accepted" ? 1 : 0;
    weightedSum += value * weight;
    totalWeight += weight;
  });

  const ratio = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

const leetTagToConcept: Record<string, string> = {
  array: "Arrays",
  "hash-table": "Hash Maps",
  "dynamic-programming": "Dynamic Programming",
  graph: "Graphs",
  tree: "Trees",
  recursion: "Recursion",
  sorting: "Sorting & Searching",
  "binary-search": "Sorting & Searching",
  "sliding-window": "Sliding Window",
  "two-pointers": "Two Pointers",
  "bit-manipulation": "Bit Manipulation",
  "linked-list": "Linked Lists",
  stack: "Stacks & Queues",
  queue: "Stacks & Queues"
};

function getFallbackConceptTags(problemTags: string[]): string[] {
  const concepts = new Set<string>();
  for (const tag of problemTags) {
    const normalized = String(tag).trim().toLowerCase();
    const mapped = leetTagToConcept[normalized];
    if (mapped && isSkillConcept(mapped)) {
      concepts.add(mapped);
    }
  }
  return Array.from(concepts);
}

async function refreshSkillScoresForUser(params: {
  userId: string;
  affectedConcepts: Set<string>;
}): Promise<void> {
  const { userId, affectedConcepts } = params;

  for (const concept of affectedConcepts) {
    const submissionsForConcept = await listSubmissionsByConcept({ userId, concept });
    const score = calculateSkillScore(submissionsForConcept);
    await upsertSkillScore({ userId, concept, score });
    await insertSkillScoreHistory({ userId, concept, score });
  }

  for (const concept of SKILL_TAXONOMY) {
    const submissionsForConcept = await listSubmissionsByConcept({ userId, concept });
    if (submissionsForConcept.length === 0) {
      continue;
    }
    const score = calculateSkillScore(submissionsForConcept);
    await upsertSkillScore({ userId, concept, score });
  }
}

export async function runAIAnalysisOnSingleSubmission(params: {
  userId: string;
  submission: SubmissionRow;
}): Promise<{
  analysis: AnalysisResult;
  aiOk: boolean;
  aiErrorMessage: string | null;
}> {
  const { userId, submission } = params;

  const prompt = buildAnalysisPrompt({
    problemTitle: submission.problem_title,
    problemTags: submission.problem_tags ?? [],
    difficulty: submission.difficulty,
    submittedCode: submission.submitted_code ?? "",
    result: submission.result,
    errorMessage: submission.error_message
  });

  const aiResult = await generateOpenRouterText(prompt);
  const parsed = aiResult.ok ? parseAnalysisResponse(aiResult.text) : parseAnalysisResponse("");

  const conceptTags =
    parsed.concept_tags.length > 0 ? parsed.concept_tags : getFallbackConceptTags(submission.problem_tags);
  const safeConceptTags = conceptTags.length > 0 ? conceptTags : ["Arrays"];

  const analysis: AnalysisResult = {
    ...parsed,
    concept_tags: safeConceptTags
  };

  await updateSubmissionAnalysis({
    submissionId: submission.id,
    aiAnalysis: JSON.stringify(analysis),
    conceptTags: safeConceptTags
  });

  await refreshSkillScoresForUser({
    userId,
    affectedConcepts: new Set(safeConceptTags)
  });

  return {
    analysis,
    aiOk: aiResult.ok,
    aiErrorMessage: aiResult.ok ? null : aiResult.error.message
  };
}

export async function runSubmissionAnalysisForUser(userId: string): Promise<{
  analysedCount: number;
  failedCount: number;
  lastError: string | null;
}> {
  const pending = (await listUnanalysedSubmissionsForUser(userId)).slice(0, ANALYSIS_BATCH_SIZE_PER_SYNC);
  let analysedCount = 0;
  let failedCount = 0;
  let lastError: string | null = null;
  const affectedConcepts = new Set<string>();

  for (let index = 0; index < pending.length; index += 1) {
    const submission = pending[index];
    const prompt = buildAnalysisPrompt({
      problemTitle: submission.problem_title,
      problemTags: submission.problem_tags ?? [],
      difficulty: submission.difficulty,
      submittedCode: submission.submitted_code ?? "",
      result: submission.result,
      errorMessage: submission.error_message
    });

    const aiResult = await generateOpenRouterText(prompt);
    const parsed = aiResult.ok ? parseAnalysisResponse(aiResult.text) : parseAnalysisResponse("");

    if (!aiResult.ok) {
      failedCount += 1;
      lastError = aiResult.error.message;
      console.error("AI analysis failed:", JSON.stringify(aiResult.error));
    }

    const conceptTags = parsed.concept_tags.length > 0 ? parsed.concept_tags : getFallbackConceptTags(submission.problem_tags);
    const safeConceptTags = conceptTags.length > 0 ? conceptTags : ["Arrays"];

    for (const concept of safeConceptTags) {
      affectedConcepts.add(concept);
    }

    await updateSubmissionAnalysis({
      submissionId: submission.id,
      aiAnalysis: JSON.stringify({ ...parsed, concept_tags: safeConceptTags }),
      conceptTags: safeConceptTags
    });
    analysedCount += 1;

    // Avoid hitting strict free-tier request-per-minute limits.
    if (index < pending.length - 1) {
      await delay(AI_CALL_DELAY_MS);
    }
  }

  await refreshSkillScoresForUser({ userId, affectedConcepts });

  return { analysedCount, failedCount, lastError };
}
