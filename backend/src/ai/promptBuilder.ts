import { SKILL_TAXONOMY } from "../lib/skillTaxonomy";

type PromptSubmission = {
  problemTitle: string;
  problemTags: string[];
  difficulty: string;
  submittedCode: string;
  result: string;
  errorMessage?: string | null;
};

export function buildAnalysisPrompt(submission: PromptSubmission): string {
  return `You are an expert software engineering instructor analysing a student's code submission.

Problem: ${submission.problemTitle}
Difficulty: ${submission.difficulty}
Platform Tags: ${submission.problemTags.join(", ")}
Result: ${submission.result}
${submission.errorMessage ? `Error: ${submission.errorMessage}` : ""}

Student's Code:
\`\`\`
${submission.submittedCode}
\`\`\`

Available skill taxonomy: ${SKILL_TAXONOMY.join(", ")}

Respond ONLY with a valid JSON object. No markdown, no explanation, no preamble. Exactly this structure:
{
  "concept_tags": ["concept from taxonomy"],
  "skill_gap": "one sentence",
  "root_cause": "one sentence",
  "post_solve_analysis": "2-3 sentences",
  "score_impact": 0
}`;
}
