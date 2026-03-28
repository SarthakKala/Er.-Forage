import { SKILL_TAXONOMY } from "./skillTaxonomy";
import type { SkillHistoryRow, SkillScoreRow } from "../models/skillScores";

export type ConceptHistoryGroup = {
  concept: string;
  snapshots: Array<{ score: number; recorded_at: string }>;
};

export function groupSkillHistoryByConcept(historyRows: SkillHistoryRow[]): ConceptHistoryGroup[] {
  const map = new Map<string, Array<{ score: number; recorded_at: string }>>();
  for (const row of historyRows) {
    const list = map.get(row.concept) ?? [];
    list.push({ score: row.score, recorded_at: row.recorded_at });
    map.set(row.concept, list);
  }
  return SKILL_TAXONOMY.map((concept) => ({
    concept,
    snapshots: map.get(concept) ?? []
  }));
}

export function buildSkillScoresForTaxonomy(rows: SkillScoreRow[]): Array<{
  concept: string;
  score: number;
  last_updated: string | null;
}> {
  const byConcept = new Map(rows.map((r) => [r.concept, r]));
  return SKILL_TAXONOMY.map((concept) => {
    const r = byConcept.get(concept);
    return {
      concept,
      score: r?.score ?? 50,
      last_updated: r?.last_updated ?? null
    };
  });
}

export function computeWeeksActive(firstSubmissionIso: string | null): number {
  if (!firstSubmissionIso) return 0;
  const first = new Date(firstSubmissionIso).getTime();
  if (!Number.isFinite(first)) return 0;
  const ms = Date.now() - first;
  if (ms <= 0) return 1;
  const weeks = Math.ceil(ms / (7 * 24 * 60 * 60 * 1000));
  return Math.max(weeks, 1);
}
