import { SKILL_TAXONOMY } from "./types";

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function scoreTone(score: number): string {
  if (score < 40) return "var(--red)";
  if (score < 60) return "var(--amber)";
  return "var(--green)";
}

export function parseAiAnalysis(raw: string | null): {
  skill_gap?: string;
  root_cause?: string;
  post_solve_analysis?: string;
  concept_tags?: string[];
} | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      skill_gap?: string;
      root_cause?: string;
      post_solve_analysis?: string;
      concept_tags?: string[];
    };
  } catch {
    return null;
  }
}

export function orderSkillScores<T extends { concept: string; score: number }>(rows: T[]): T[] {
  const map = new Map(rows.map((r) => [r.concept, r]));
  return SKILL_TAXONOMY.map((c) => map.get(c)).filter(Boolean) as T[];
}
