export const SKILL_TAXONOMY = [
  "Arrays",
  "Hash Maps",
  "Dynamic Programming",
  "Graphs",
  "Trees",
  "Recursion",
  "Sorting & Searching",
  "Sliding Window",
  "Two Pointers",
  "Bit Manipulation",
  "Linked Lists",
  "Stacks & Queues"
] as const;

export type SkillConcept = (typeof SKILL_TAXONOMY)[number];

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Submission = {
  id: string;
  problem_id: string;
  problem_title: string;
  problem_tags: string[];
  difficulty: "easy" | "medium" | "hard";
  submitted_code: string | null;
  result: "accepted" | "wrong" | "tle" | "error";
  error_message: string | null;
  ai_analysis: string | null;
  concept_tags: string[];
  submitted_at: string;
  is_manual_paste: boolean;
};

export type Assignment = {
  id: string;
  problem_title: string;
  platform_url: string;
  concept_target: string;
  status: "pending" | "completed";
  assigned_at: string;
};

export type SkillPoint = {
  concept: string;
  score: number;
};

export type SkillHistory = {
  concept: string;
  snapshots: Array<{ score: number; recorded_at: string }>;
};

export type PortfolioPayload = {
  user: { id: string; name: string; email: string };
  generatedAt: string;
  skillScores: Array<{ concept: string; score: number; last_updated: string | null }>;
  skillHistory: SkillHistory[];
  stats: {
    totalSubmissions: number;
    problemsSolved: number;
    completedAssignments: number;
    weeksActive: number;
  };
  reports: Array<{ id: string; token: string; created_at: string; report_name?: string | null }>;
};
